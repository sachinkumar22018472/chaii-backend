import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet
    const {content} = req.body
    const userId = req.user._id

    if (!content || content.trim()==="") {
        throw new ApiError(400, "Tweet Cannot be empty")
    }

    if (content.length > 280) {
        throw new ApiError(400, "Content SizeLimit exceeded")
    }

    const tweet = await Tweet.create({
        content,
        owner: userId,
    })

    return res 
    .status(200)
    .json(
        new ApiResponse(201, tweet, "Tweet Created successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    const {userId} = req.params
    const { page = 1, limit = 10 } = req.query

    if(!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid userId")
    }


    const user = await User.findById(userId)
    if(!user) {
        throw new ApiError(404, "userId does not exist")
    }

    const skip = (page - 1) * limit

    const tweets = await Tweet.find({ owner: userId })

    const totalTweets = await Tweet.countDocuments({ owner: userId })


    return res
    .status(200)
    .json(
        new ApiResponse(200, {
            tweets,
            page: Number(page),
            totalPages: Math.ceil(totalTweets/limit),
            totalTweets
        }, "User tweets fetched successfully"

        )
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    const { tweetId } = req.params
    const { content } = req.body
    const userId = req.user._id

    if(!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(400, "Invalid tweet id")
    }

    const tweet = await Tweet.findById(tweetId)
    if (!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if (tweet.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "Cannot edit owner not matched")
    }

    if (!content || content.trim()==="") {
        throw new ApiError (404, "Tweet cannot be empty")
    }

    if (content.length > 280) {
        throw new ApiError (400, "Content SizeLimit exceeded")
    }

    tweet.content = content
    await tweet.save()

    return res.status(200).json(
        new ApiResponse (200, tweet, "updated tweet")
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    const { tweetId } = req.params

    if (!tweetId) {
        throw new ApiError ( 400, "Tweet id is required")
    }

    if (!mongoose.Types.ObjectId.isValid(tweetId)) {
        throw new ApiError(404, "Tweet ID invalid")
    }

    const tweet = await Tweet.findById(tweetId)

    if (!tweet) {
        throw new ApiError (404, "Tweet not found")
    }

    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this tweet")
    }

    await Tweet.findByIdAndDelete(tweetId)

    return res.status(200).json(
        new ApiResponse(200, null, "Tweet deleted successfully")
    )
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}