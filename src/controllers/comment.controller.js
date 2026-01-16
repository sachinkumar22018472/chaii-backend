import mongoose from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";


import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js";

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
    if(!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }
    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "video not found")
    }
    const skip = (page - 1)*limit

    const comments = await Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $sort: {createdAt: -1}
        },
        {
            $skip: skip
        },
        {
            $limit: Number(limit)
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                localField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                content: 1,
                createdAt: 1,
                owner: {
                    _id: "$owner._id",
                    username: "$owner.username",
                    avatar: "$owner.avatar"
                }
            }
        }
    ])
    const totalComments = await Comment.countDocuments({video: videoId})

    return res.status(200).json(
        200,
        {
            comments,
            totalComments,
            page: Number(page),
            limit: Number(limit)
        },
        "video comments fetched successfully"
        
    )

})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    const {videoId} = req.params
    const {content} = req.body
    const userId = req.user._id

    if(!mongoose.Types.ObjectId.isValid(videoId) || 
        !mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(400, "Invalid User or Video ID") 
        }

    
    const video = await Video.findById(videoId)

    if(!video) {
        throw new ApiError(400, "video not found")
    }

    if (!content || content.trim() === "") {
        throw new ApiError(400, "comment content is required")
    }

    const newComment = await Comment.create({
        content,
        video: videoId,
        owner: userId
    })

    const comment = await Comment.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(newComment._id)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {

            $unwind: "owner"
        },
        {
            $project: {
                _id: 1,
                content: 1,
                createdAt: 1,
                owner: {
                    _id: "$owner._id",
                    username: "$owner.username",
                    avatar: "$owner.avatar"
                }
            }
        }
    ])
    return res.status(200).json(
        new ApiResponse(
        200,
        comment[0],
        "comment added successfully"
        )
    )
    
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const userId = req.user._id

    const {content} = req.body
    const {commentId} = req.params

    if(!mongoose.Types.ObjectId.isValid(userId) ||
        !mongoose.Types.ObjectId.isValid(commentId)) {
            throw new ApiError(400, "Invalid user or comment ID")
        }
        
        if (!content || content.trim() === "" ) {
            throw new ApiError(400, "Comment content is required")
        }
        
        
        const comment = await Comment.findById(commentId) 
        
        if(!comment) {
            throw new ApiError(400, "comment not found")
        }

        if(comment.owner.toString() !== userId.toString()) {
            throw new ApiError(400, "you are not allowed to update this comment")
        }

        await Comment.findByIdAndUpdate(commentId, {
            content
        })

        const updateComment = await Comment.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(commentId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            {
                $unwind: "$owner"
            },
            {
                $project: {
                    _id: 1,
                    content: 1,
                    updateAt: 1,
                    owner: {
                        _id: "$owner._id",
                        username: "$owner.username",
                        avatar: "$owner.avatar"
                    }
                }
            }
        ])
    return res.status(200).json(
        new ApiResponse(
            200,
            updatedComment[0],
            "Comment updated successfully"
        )
    )

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params
    const userId = req.user._id

    if (!mongoose.Types.ObjectId.isValid(userId) ||
        !mongoose.Types.ObjectId.isValid(commentId)) {
            throw new ApiError(400, "Invalid user or comment ID")
        }

    const comment = await Comment.findById(commentId) 

    if(!comment) {
        throw new ApiError(400, "comment not found")
    }

    if(comment.owner.toString() !== userId.toString()) {
        throw new ApiError(400, "you are not allowed to delete this comment")
    }

    await Comment.findByIdAndDelete(comment)

    return res.status(200).json(
        new ApiResponse(
            200,
            { _id: commentId },
            "Comment deleted successfully"
        )
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
    }