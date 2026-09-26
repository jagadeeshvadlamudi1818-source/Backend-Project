import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";


// Generate Access Token + Refresh Token
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new ApiError(404, "User not found");
        }

        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken;

        await user.save({
            validateBeforeSave: false
        });

        return {
            accessToken,
            refreshToken
        };

    } catch (error) {
        throw new ApiError(
            500,
            "Something went wrong while generating refresh and access token"
        );
    }
};


// =========================
// REGISTER USER
// =========================

const registerUser = asyncHandler(async (req, res) => {

    // Get text fields from request body
    const {
        fullName,
        email,
        username,
        password
    } = req.body;

    console.log("Request body:", req.body);
    console.log("Uploaded files:", req.files);


    // Check required fields
    if (
        [fullName, email, username, password].some(
            (field) =>
                typeof field !== "string" ||
                field.trim() === ""
        )
    ) {
        throw new ApiError(400, "All fields are required");
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


    // Get uploaded file paths
    const avatarLocalPath =
        req.files?.avatar?.[0]?.path;

    const coverImageLocalPath =
        req.files?.coverImage?.[0]?.path;


    // Avatar is required
    if (!avatarLocalPath) {
        throw new ApiError(
            400,
            "Avatar file is required"
        );
    }


    // Upload avatar to Cloudinary
    const avatar =
        await uploadOnCloudinary(avatarLocalPath);


    // Upload cover image if provided
    let coverImage = null;

    if (coverImageLocalPath) {
        coverImage =
            await uploadOnCloudinary(coverImageLocalPath);
    }


    // Check avatar upload
    if (!avatar) {
        throw new ApiError(
            400,
            "Avatar upload failed"
        );
    }


    // Create user
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    });


    // Remove password and refreshToken
    const createdUser =
        await User.findById(user._id)
            .select("-password -refreshToken");


    if (!createdUser) {
        throw new ApiError(
            500,
            "Something went wrong while registering the user"
        );
    }


    // Send response
    return res
        .status(201)
        .json(
            new ApiResponse(
                201,
                createdUser,
                "User registered successfully"
            )
        );
});


// =========================
// LOGIN USER
// =========================

const loginUser = asyncHandler(async (req, res) => {

    console.log("Login request body:", req.body);

    const {
        email,
        password
    } = req.body;


    // Check fields
    if (!email || !password) {
        throw new ApiError(
            400,
            "Email and password are required"
        );
    }


    // Find user
    const user = await User.findOne({
        email
    });


    if (!user) {
        throw new ApiError(
            404,
            "User does not exist"
        );
    }


    // Check password
    const isPasswordCorrect =
        await user.isPasswordCorrect(password);


    if (!isPasswordCorrect) {
        throw new ApiError(
            401,
            "Invalid email or password"
        );
    }


    // Generate tokens
    const {
        accessToken,
        refreshToken
    } = await generateAccessAndRefreshTokens(
        user._id
    );


    // Remove sensitive information
    const loggedInUser =
        await User.findById(user._id)
            .select("-password -refreshToken");


    // Send response
    return res
        .status(200)
        .cookie("accessToken", accessToken, {
            httpOnly: true,
            secure: true
        })
        .cookie("refreshToken", refreshToken, {
            httpOnly: true,
            secure: true
        })
        .json(
            new ApiResponse(
                200,
                {
                    user: loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
            )
        );
});


// Export controllers
export {
    registerUser,
    loginUser
};