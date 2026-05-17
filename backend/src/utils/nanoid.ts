import { customAlphabet } from "nanoid";

// URL-safe alphabet, no look-alike characters (0 O I l 1)
const alphabet = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";

/** Generates a unique short code (default 7 chars) */
export const generateShortCode = customAlphabet(alphabet, 7);

/** Generates a longer token for API keys etc. */
export const generateToken = customAlphabet(alphabet, 32); 