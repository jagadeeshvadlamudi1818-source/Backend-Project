import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


const registerUser = asyncHandler(async (req, res) => {

    const {
        fullName,
        email,
        username,
        password
    } = req.body;

    console.log("email:", email);


    // Check if fields are empty
    if (
        [fullName, email, username, password]
            .some((field) => field?.trim() === "")
    ) {
        throw new ApiError(
            400,
            "All fields are required"
        );
    }


    // Check if user already exists
    const existedUser = await User.findOne({
        $or: [
            { username },
            { email }
        ]
    });

    if (existedUser) {
        throw new ApiError(
            409,
            "User with email or username already exists"
        );
    }


    // Get uploaded files
    const avatarLocalPath = req.files?.avatar?.[0]?.path;

    const coverImageLocalPath =
        req.files?.coverImage?.[0]?.path;


    // Avatar is required
    if (!avatarLocalPath) {
        throw new ApiError(
            400,
            "Avatar file is required"
        );
    }


    // Upload avatar
    const avatar = await uploadOnCloudinary(
        avatarLocalPath
    );


    // Upload cover image
    let coverImage = null;

    if (coverImageLocalPath) {
        coverImage = await uploadOnCloudinary(
            coverImageLocalPath
        );
    }


    // Check avatar upload
    if (!avatar) {
        throw new ApiError(
            400,
            "Avatar upload failed"
        );
    }


    // Create user in MongoDB
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });


    // Remove password and refresh token
    const createdUser = await User.findById(user._id)
        .select("-password -refreshToken");


    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        );
    }

    // Send response
    return res.status(201).json(
        new ApiResponse(
            201,
            createdUser,
            "User registered successfully"
        )
    );
});


export {
    registerUser
};