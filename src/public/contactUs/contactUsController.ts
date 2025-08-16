import { Request, Response } from "express";
import ApiError from "../../utils/ApiError";
import ApiResponse from "../../utils/ApiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { ContactUS } from "../../modals/contactUs.model";
import { contactUsContent } from "../../utils/emailContent";
import { isValidObjectId } from "../../utils/helper";
import { CommonService } from "../../services/common.services";

// Uncomment and configure this when email service is available
// import { sendEmail } from "../../utils/emailService";

const contactService = new CommonService(ContactUS);

// Raise a query
const raiseQuery = asyncHandler(async (req: Request, res: Response) => {
  const { senderName, senderEmail, query, senderMobile } = req.body;

  if (
    [senderName, senderEmail, query, senderMobile].some(
      (field: string) => !field?.trim()
    )
  ) {
    return res
      .status(400)
      .json(new ApiError(400, "", "All fields are mandatory"));
  }

  const raisedQuery = await contactService.create({
    senderName,
    senderEmail,
    senderMobile,
    query,
  });

  if (!raisedQuery) {
    return res
      .status(500)
      .json(
        new ApiError(500, "", "Something went wrong while raising the query!")
      );
  }

  // Send mail notification to admin
  const htmlContent = contactUsContent(
    senderName,
    senderEmail,
    query,
    senderMobile
  );
  const subject = "Query raised from unfazed user";

  // Uncomment below lines when email service is active
  // if (process.env.NODE_ENV !== "production") {
  //   await sendEmail("adarshsrivastav375@gmail.com", subject, htmlContent);
  // }

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Query raised successfully"));
});

// Change query status
const changeQueryStatus = asyncHandler(async (req: Request, res: Response) => {
  const { _id } = req.params;
  const { status } = req.body;

  if (!isValidObjectId(_id)) {
    return res.status(400).json(new ApiError(400, "", "Invalid Object ID"));
  }

  const updatedQuery = await contactService.updateById(_id, { status });

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { result: updatedQuery },
        "Query status changed successfully"
      )
    );
});

// Get all queries
const getQueryList = asyncHandler(async (req: Request, res: Response) => {
  const result = await contactService.getAll(req.query);
  return res
    .status(200)
    .json(new ApiResponse(200, result, "List fetched successfully"));
});

// Get query by ID
const getQueryById = asyncHandler(async (req: Request, res: Response) => {
  const { _id } = req.params;
  const query = await contactService.getById(_id, false);
  return res
    .status(200)
    .json(new ApiResponse(200, query, "Query fetched successfully"));
});

// Delete query by ID
const deleteQuery = asyncHandler(async (req: Request, res: Response) => {
  const { _id } = req.params;

  if (!isValidObjectId(_id)) {
    return res.status(400).json(new ApiError(400, "", "Invalid query ID"));
  }

  const deleted = await contactService.deleteById(_id);

  if (!deleted) {
    return res
      .status(404)
      .json(new ApiError(404, "", "Query not found or already deleted"));
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Query deleted successfully"));
});

export {
  raiseQuery,
  changeQueryStatus,
  getQueryList,
  getQueryById,
  deleteQuery,
};
