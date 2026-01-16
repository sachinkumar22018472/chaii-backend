import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    const userId = req.user._id

    if (!mongoose.Types.ObjectId.isValid(videoId) ||
        !mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(400, "Invalid video or user Id")
    }
    const video = await Like.findById(videoId)

    if(!video) {
        throw new ApiError(400, "video not find")
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: userId
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);

        return res.status(200).json(
            new ApiResponse(200, {liked: false}, "video unliked")
        )
    }

    await Like.create({
        video: videoId,
        likedBy: userId
    })

    return res.status(200).json(
        new ApiResponse(200, {liked: true}, "video liked")
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    const userId = req.user._id
    if (!mongoose.Types.ObjectId.isValid(commentId) ||
        !mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(400, "Invalid user or comment ID")
        }
    const comment = Comment.findById(commentId)

    if (!video) {
        throw new ApiError("comment not found")
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: userId
    }) 

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)

        return res.status(200).json(
            new ApiResponse(200, {liked: false}, "comment unliked")
        )
    }

    await Like.create({
        comment: commentId,
        likedBy: userId
    })

    return res.status(200).json(
        new ApiResponse(200, {liked: true}, "comment liked")
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    const userId = req.user._id

    if (!mongoose.Types.ObjectId.isValid(tweetId) ||
        !mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(400, "Invalid tweet or user Id")
        }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError(400, "tweet is not found")
    }

    const existingLike = await Like.findOne({
        tweet: "tweetId",
        likedBy: "userId"
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)

        return res.status(200).json(
            new ApiResponse(200, {liked: false}, "unliked tweet")
        )
    }
    await Like.create({
        tweet: "tweetId",
        likedBy: "userId"
    })

    return res.status(200).json(
        new ApiResponse(200, {liked: true}, "liked tweet")
    )


}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    const userId = req.user._id

    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid user Id")
    }

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $exists: true }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video"
            }
        },
        {$unwind: "$video"},
        {
            $lookup: {
                from: "users",
                localField: "video.owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {$unwind: "$owner"},
        {
            $project: {
                _id: "$video._id",
                title: "$video.title",
                thumbnail: "$video.thumbnail",
                duration: "$video.duration",
                createdAt: "$video.createdAt",
                "owner._id": 1,
                "owner.username": 1,
                "owner.avatar": 1
            }
        },
        { $sort: { createdAt: -1 } }
    ])
    
    return res.status(200).json(
        new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    );
    
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}