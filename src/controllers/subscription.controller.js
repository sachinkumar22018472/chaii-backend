import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    const userId = req.user._id

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }

    if (channelId === userId.toString()) {
        throw new ApiError(400, "You cannot subscribe to yoursel")
    }

    const existing = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    })

    if (existing) {
        await existing.deleteOne()


        return res.status(200).json(
            new ApiResponse(200, {subscribed: false}, "Unsubscribed successfully")
        )
    }
    await Subscription.create({
        subscriber: userId,
        channel: channelId
    })

    return res.status(200).json(
        new ApiResponse(200, {subscribed: true}, "Subscribed successfully")
    )
})  

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId = req.user._id

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel Id")
    }

    if (channelId !== userId.toString()) {
        throw new ApiError(403, "you are not allowed to view this channel's subscribers")

    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscriber"
            }
        },
        { $unwind: "$subscriber"},

        {
            $project: {
                _id: 0,
                "subscriber._id": 1,
                "subscriber.ussername": 1,
                "subscriber.avatar": 1
            }
        }

    ])

    return res.status(200).json(
        new ApiResponse(
            200,
            subscribers.map(s => s.subscriber),
            "channel subscriber fetched successfully"
        )
    )


})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    const userId = req.user._id

    const channels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channel"
            }
        },
        {$unwind: "$channel"},
        {
            $project: {
                _id: 0,
                "channel._id": 1,
                "channel.username": 1,
                "channel.avatar": 1
            }
        }
    ])
    return res.status(200).json(
        new ApiResponse(
            200,
            channels.map(c => c.channel),
            "Subscribed channels fetched successfully"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}