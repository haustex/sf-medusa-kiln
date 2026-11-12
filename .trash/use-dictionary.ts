"use client"

import { useParams } from "next/navigation"
import { getDictionary } from "./dictionaries"

/** UI strings for the current market in client components (the default market without a prefix). */
export const useDictionary = () => getDictionary(useParams()?.countryCode as string | undefined)
