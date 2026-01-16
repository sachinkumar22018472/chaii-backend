import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelId = req.user._id
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel Id")
    }

    const videoStats = await Video.aggregate([
        {
            $match: {owner: new mongoose.Types.ObjectId(channelId)}
        },
        {
            $group: {
                _id: null,
                totalVideos: {$sum: 1},
                totalViews: {$sum: "$views"}
            }
        }
    ])

    const subscribers = await Subscription.countDocuments({
        channel: channelId
    })

    const likes = await Like.aggregate([
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
            $match: {
                "video.owner": new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $count: "totallikes"
        }
    ])
    return res.status(200).json(
        new ApiResponse(200, {
            totalVideos: videoStats[0]?.totalVideos || 0,
            totalViews: videoStats[0]?.totalViews || 0,
            totalSubscribers: subscribers,
            totalLikes: likes[0]?.totalLikes || 0
        }, "Channel stats fetched successfully")
    );
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const {channelId} = req.params
    const { page = 1, limit = 10 } = req.query

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel Id")
    }

    const channel = await User.findById(channelId)
    if (!channel) {
        throw new ApiError(404, "Channel not found")
    }
    const skip = (page - 1) * limit

    const videos = await Video.aggregate([
        {
            
                $match: {
                    owner: new mongoose.Types.ObjectId(channelId)
                }
            
        },
        {
            $sort: { createdAt: -1}
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
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "owner"
        },
        {
            $project: {
                title: 1,
                description: 1,
                thumbnail: 1,
                videoFile: 1,
                views: 1,
                createdAt: 1,
                owner: {
                    _id: 1,
                    username: 1,
                    avatar: 1
                }
            }
        }
    ])
    const totalVideos = await Video.countDocuments({owner: channelId})


    return res.status(200).json(
        new ApiResponse(
            200,
            {
                channel: {
                _id: channel._id,
                username: channel.username,
                avatar: channel.avatar
            },
            videos,
            totalVideos,
            page: Number(page),
            limit: Number(limit)            
            },
            "channel videos fetched successfully"
        )
    )

})

export {
    getChannelStats, 
    getChannelVideos
    }