"use client"

import { useParams } from "next/navigation"
import { getDictionary } from "./dictionaries"

/** UI strings for the current market in client components (`/` = id, `/us` = en). */
export const useDictionary = () => getDictionary((useParams()?.countryCode as string | undefined) ?? "id")
