import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { User, IUser } from "../auth/user.model";
import { jwtConfig } from "../../config/jwt";
import { RegisterDTO, LoginDTO, LoginResponseDTO } from "../auth/auth.dto";

export class AuthService {
  static async register(dto: RegisterDTO) {
    if (!dto.password || !dto.email) {
      throw new Error("Email and password are required");
    }
    const hash = await bcrypt.hash(dto.password, 10);
    const user = await User.create({
      email: dto.email,
      passwordHash: hash,
    });
    return user;
  }

  static async login(dto: LoginDTO): Promise<LoginResponseDTO> {
    const user = await User.findOne({ email: dto.email });
    if (!user) throw new Error("Invalid credentials");

    const match = await bcrypt.compare(dto.password, user.passwordHash);
    if (!match) throw new Error("Invalid credentials");

    const accessToken = jwt.sign(
      { sub: user._id, role: user.role },
      jwtConfig.accessSecret,
      { expiresIn: jwtConfig.accessExpiry }
    );

    const refreshToken = jwt.sign(
      { sub: user._id },
      jwtConfig.refreshSecret,
      { expiresIn: jwtConfig.refreshExpiry }
    );

    user.refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await user.save();

    return {
      message: "Logged in successfully",
      accessToken,
      refreshToken,
      user: {
        id: user._id.toString(),
        email: user.email,
        role: user.role || "user",
      },
    };
  }

  static async refresh(refreshToken: string) {
    const payload = jwt.verify(
      refreshToken,
      jwtConfig.refreshSecret
    ) as any;

    const user = await User.findById(payload.sub);
    if (!user || !user.refreshTokenHash)
      throw new Error("Unauthorized");

    const valid = await bcrypt.compare(
      refreshToken,
      user.refreshTokenHash
    );
    if (!valid) throw new Error("Unauthorized");

    const accessToken = jwt.sign(
      { sub: user._id, role: user.role },
      jwtConfig.accessSecret,
      { expiresIn: jwtConfig.accessExpiry }
    );

    return { accessToken };
  }

  static async logout(userId: string) {
    await User.findByIdAndUpdate(userId, {
      refreshTokenHash: null,
    });
  }
}
