import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    const userId = req.user._id;

    if(!name?.trim() || !description.trim()) {
        throw new ApiError(400, "Playlist or Description name is required")
    }
    const playlist = await Playlist.create({
        name,
        description,
        owner: userId
    });
    
    return res.status(201).json(
        new ApiResponse(201, playlist, "Playlist created successfully")
    );  

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    
    //TODO: get user playlists
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid userID")
    }

    const playlists = await Playlist.aggregate([
        
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },

        
        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
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
        { $unwind: "$owner" },

        
        {
            $addFields: {
                totalVideos: { $size: "$videos" },
                totalDuration: { $sum: "$videos.duration" }
            }
        },

       
        {
            $project: {
                name: 1,
                description: 1,
                totalVideos: 1,
                totalDuration: 1,
                createdAt: 1,
                "owner._id": 1,
                "owner.username": 1,
                "owner.avatar": 1
            }
        },

        
        { $sort: { createdAt: -1 } }
    ]);

    return res.status(200).json(
        new ApiResponse(200, playlists, "User playlists fetched successfully")
    );

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!mongoose.Types.ObjectId.isValid(playlistId)) {
        throw new ApiError (400, "Invalid playlist ID")
    }
    const playlist = await Playlist.aggregate([
        {
            $match: {_id: new mongoose.Types.ObjectId(playlistId)}
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {$unwind : "$owner"},

        {
            $lookup: {
                from: "videos",
                localField: "videos",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $project: {
                name: 1,
                description: 1,
                createdAt: 1,
                "owner._id": 1,
                "owner.username": 1,
                "owner.avatar": 1,
                "videos._id": 1,
                "videos.title": 1,
                "videos.thumbnail": 1,
                "videos.duration": 1

            }
        }
    ])
    if(!playlist.length) {
        throw new ApiError(400, "Playlist not found");
    }    
    

    return res.status(200).json(
        new ApiResponse(200, playlist[0], "Playlist fetched successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    const userId = req.user._id

    if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError (400, "Invalid user ID or Invalid video ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist) {
        throw new ApiError(400, "Playlist not found")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError (400, "You are not allowed to Add video to the playlist")
    }

    const video = await video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "video not found")
    }

    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "video already exist in playlist")
    }

    playlist.videos.push(videoId);
    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "video added to playlist successfully")
    )

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist
    const userId = req.user._id

    if (!mongoose.Types.ObjectId.isValid(playlistId) || !mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if (playlist.owner.isString() !== req.user._id.isString()) {
        throw new ApiError (400, "you are not allowed to remove video from playlist")
    }

    const video = await Video.findById(videoId) 

    if (!video) {
        throw new ApiError(400, "video not found")
    }

    const isPresent = playlist.videos.some(
        (vid) => vid.toString() === videoId
    )


    if (!isPresent) {
        throw new ApiError(404, "video not found in the playlist")
    }

    playlist.videos = playlist.videos.filter(
        (vid => vid.toString() !== videoId)
    )

    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "video removed from playlist successfully")
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const userId = req.user._id
    // TODO: delete playlist
    if (!mongoose.Types.ObjectId.isValid(playlistId) ||
        !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid Playlist ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Playlist does not exist")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(400, "tou are not allowed to delete playlist")
    }

    await playlist.findByIdAndDelete(playlistId)
    

    return res.status(200).json(
        new ApiResponse(200, null, "Playlist deleted successfully")
    )
    
})


const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
    const userId = req.params._id;

    if (!mongoose.Types.ObjectId.isValid(playlistId) ||
        !mongoose.Types.ObjectId.isValid(userId)) {
        throw new ApiError(400, "Invalid Plylist or User ID")
    }

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) {
        throw new ApiError(400, "Playlist does not exist")
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(400, "you are not allowed to update playlist")
    }

    if (name?.trim()) {
        playlist.name = name;
    }

    if (description?.trim()) {
        playlist.description = description;
    }

    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist updated successfully")
    );   

})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}