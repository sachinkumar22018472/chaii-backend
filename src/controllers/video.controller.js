import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary, uploadOneCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    const skip = (page-1)* limit
    const videos = await Video.aggregate([
        {
            $sort: { createdAt: -1 }
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
                title: 1,
                videoUrl: 1,
                thumbnail: 1,
                createdAt: 1,
                "owner._id": 1,
                "owner.username": 1,
                "owner.avatar": 1
            }
        },
        { $skip: skip },
        { $limit: Number(limit) }
    ])
    const totalVideos = await Video.countDocuments()

    return res.status(200).json(
        new ApiResponse(200, {
            videos,
            page: Number(page),
            totalPages: Math.ceil(totalVideos/limit),
            totalVideos
        }, "videos fetched successfully" ), 
    )

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title) {
        throw new ApiError(400, "video title is required")
    }

    const videoLocalPath = req.files?.[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if (!videoLocalPath) {
        throw new ApiError(400, "Video file is required")
    }

    const videoUpload = await uploadOneCloudinary(videoLocalPath)
    const thumbnailUpload = thumbnailLocalPath
        ? await uploadOneCloudinary(thumbnailLocalPath)
        : null

    if (!videoUpload?.url) {
        throw new ApiError(500, "video upload failed")
    }

    const video = await Video.create({
        title,
        description,
        videoUrl: videoUpload.url,
        thumbnail: thumbnailUpload?.url || "",
        owner: req.user._id
    })

    return res.status(200).json(
        new ApiResponse(200, video, "video published successfully")
    )

})


const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.aggregate([
        {
            $match: {_d: new mongoose.Types.ObjectId(videoId)}
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
                videoUrl: 1,
                thumbnail: 1,
                createdAt: 1,
                "owner._id": 1,
                "owner.username": 1,
                "owner.avatar": 1
            }
        }       
    ])
    if (!video.length) {
        throw new ApiError(404, "video not found")
    }

    return res.status(200).json(
        new ApiResponse(200, video[0], "video fetched successfully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail
    const { title, description } = req.body

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "video not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "you are not allowed to update this video")
    }

    if (title) video.title = title
    if (description) video.description = description

    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path
    if (thumbnailLocalPath) {
        const thumbnailUpload = await uploadOneCloudinary(thumbnailLocalPath)
        if (!thumbnailUpload?.url) {
            throw new ApiError(500, "Thumbnail upload failed")
        }
        video.thumbnail = thumbnailUpload.url
    }
    await video.save()

    return res.status(200).json(
        new ApiResponse(200, video, "video updated successfulluy")
    )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "video id not found")
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError (403, "you are not allowed to delete the video")
    }

    await Video.deleteOne() 

    return res.status(200).json(
        new ApiResponse(
            200,
            null,
            "video is deleted successfully"
        )
    )

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
   if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "video not found")
    }

    if(video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError (400, "you are not alloweed to change publish status")
    }

    video.isPublished = !video.isPublished

    await video.save()


    return res.status(200).json(
        new ApiResponse(
            200, 
            {isPublished: video.isPublished},
            `video is now ${video.isPublished ? "published" : "unpublished"}`
        )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}