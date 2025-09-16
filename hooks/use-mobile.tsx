"use client"

import { useEffect, useState } from "react"

/**
 * Hook to detect if the device is mobile based on window width.
 * @returns Boolean indicating if the screen width is less than 768px.
 * @example
 * const isMobile = useMobile();
 * if (isMobile) { // render mobile layout }
 */
export function useMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }

    // Initial check
    checkIfMobile()

    // Add event listener
    window.addEventListener("resize", checkIfMobile)

    // Clean up
    return () => {
      window.removeEventListener("resize", checkIfMobile)
    }
  }, [])

  return isMobile
}
