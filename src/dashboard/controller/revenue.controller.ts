import ApiError from "../../utils/ApiError";
import { User } from "../../modals/user.model";
import ApiResponse from "../../utils/ApiResponse";
import { Booking } from "../../modals/booking.model";
import { Ground } from "../../modals/groundOwner.model";
import { Request, Response, NextFunction } from "express";
import { formatISO, isValid, parseISO, startOfDay, subDays } from "date-fns";

export const getYearlyRevenue = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const currentYear =
      parseInt(req.query.year as string) || new Date().getFullYear();
    const previousYear = currentYear - 1;

    const matchCriteria = {
      paymentStatus: "paid",
      createdAt: {
        $gte: new Date(`${previousYear}-01-01T00:00:00.000Z`),
        $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`),
      },
    };

    const revenueData = await Booking.aggregate([
      { $match: matchCriteria },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          totalAmount: { $sum: "$finalAmount" },
        },
      },
    ]);

    // Create monthly data arrays for both years
    const monthlyData: Record<string, { combined: number[] }> = {
      [previousYear]: { combined: Array(12).fill(0) },
      [currentYear]: { combined: Array(12).fill(0) },
    };

    for (const entry of revenueData) {
      const { year, month } = entry._id;
      const amount = entry.totalAmount;
      if (monthlyData[year]) {
        monthlyData[year].combined[month - 1] += amount;
      }
    }

    // Calculate totals
    const totalCurrent = monthlyData[currentYear].combined.reduce(
      (a, b) => a + b,
      0
    );
    const totalPrevious = monthlyData[previousYear].combined.reduce(
      (a, b) => a + b,
      0
    );

    // Calculate percentage change
    const percentageChange =
      totalPrevious === 0
        ? 100
        : Math.round(((totalCurrent - totalPrevious) / totalPrevious) * 100);

    // Final response
    return res.status(200).json(
      new ApiResponse(
        200,
        {
          currentYear,
          previousYear,
          totalCurrent,
          totalPrevious,
          percentageChange,
          monthlyData,
        },
        "Yearly revenue data fetched"
      )
    );
  } catch (error) {
    console.error("error: ", error);
    next(new ApiError(500, "Failed to fetch revenue data", error));
  }
};

export const getDashboardStats = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { startDate, endDate } = req.query;

    const end =
      endDate && isValid(new Date(endDate as string))
        ? startOfDay(parseISO(endDate as string))
        : startOfDay(new Date());

    const start =
      startDate && isValid(new Date(startDate as string))
        ? startOfDay(parseISO(startDate as string))
        : subDays(end, 13);

    const totalDays =
      Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const extendedStart = subDays(start, totalDays); // Previous period

    // Common helper
    const aggregateDaily = async (
      model: any,
      dateField: string,
      sumField?: string,
      match: any = {}
    ): Promise<number[]> => {
      const pipeline: any[] = [
        {
          $match: {
            [dateField]: { $gte: extendedStart, $lte: end },
            ...match,
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: `$${dateField}` },
            },
            value: sumField ? { $sum: `$${sumField}` } : { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ];

      const result = await model.aggregate(pipeline);

      // Create a lookup map for fast access
      const lookup: any = new Map(result.map((r: any) => [r._id, r.value]));

      // Fill all days (totalDays * 2)
      const buckets: number[] = [];
      for (let i = totalDays * 2 - 1; i >= 0; i--) {
        const day = subDays(end, i);
        const key = formatISO(day, { representation: "date" });
        buckets.push(lookup.get(key) || 0);
      }

      return buckets;
    };

    // Fetch all in parallel
    const [payments, activeGrounds, activeUsers, activeGroundOwners] =
      await Promise.all([
        aggregateDaily(Booking, "createdAt", "finalAmount", {
          paymentStatus: "paid",
        }),
        aggregateDaily(Ground, "createdAt", undefined, { status: "active" }),
        aggregateDaily(User, "createdAt", undefined, { role: "user" }),
        aggregateDaily(User, "createdAt", undefined, { role: "ground_owner" }),
      ]);

    const totalRevenue = payments.map((_, i) => payments[i]);

    const prevIndex = 0;
    const currIndex = totalDays;

    const calculateStats = (data: number[]) => {
      const previous = data.slice(prevIndex, currIndex);
      const current = data.slice(currIndex);
      const totalCurrent = current.reduce((a, b) => a + b, 0);
      const totalPrevious = previous.reduce((a, b) => a + b, 0);

      let percentageChange = 0;
      if (totalPrevious === 0 && totalCurrent > 0) percentageChange = 100;
      else if (totalPrevious === 0 && totalCurrent === 0) percentageChange = 0;
      else if (totalPrevious === 0 && totalCurrent < 0) percentageChange = -100;
      else
        percentageChange = +(
          ((totalCurrent - totalPrevious) / totalPrevious) *
          100
        ).toFixed(2);

      return {
        totalCurrent,
        totalPrevious,
        percentageChange,
        chartData: current,
      };
    };

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          revenue: calculateStats(totalRevenue),
          activeUsers: calculateStats(activeUsers),
          activeGrounds: calculateStats(activeGrounds),
          activeGroundOwners: calculateStats(activeGroundOwners),
        },
        "Dashboard data fetched"
      )
    );
  } catch (err) {
    next(err);
  }
};
