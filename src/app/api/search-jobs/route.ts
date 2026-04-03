import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { role, location, experience } = await req.json()
    const apiKey = process.env.RAPIDAPI_KEY

    // JSearch requires a more descriptive query for best results
    const searchQuery = `${role} in ${location || "Remote"} ${experience || ""}`
    
    // Fallback if no API key
    if (!apiKey) {
      return NextResponse.json({ 
        jobs: [
          { job_title: `${role} (Preview)`, company: "Sanctuary Alpha", location: location || "Global", apply_link: "#" },
          { job_title: `Lead ${role} (Preview)`, company: "Orchestra AI", location: "Remote", apply_link: "#" }
        ],
        warning: "API Key missing. Showing preview data."
      })
    }

    const response = await fetch(`https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(searchQuery)}&num_pages=1`, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
      }
    })

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("API Key exists, but is not subscribed to JSearch on RapidAPI. Please subscribe at rapidapi.com/letscrape-6bRBa3QG1q/api/jsearch.")
      }
      const errData = await response.json().catch(() => ({}))
      throw new Error(errData.message || "RapidAPI connection failed")
    }

    const data = await response.json()
    
    // Handle empty results gracefully
    if (!data.data || data.data.length === 0) {
      return NextResponse.json({ jobs: [], warning: "No opportunities matched this exact configuration." })
    }
    
    // Transform JSearch format to our internal format
    const jobs = data.data.map((job: any) => ({
      job_title: job.job_title,
      company: job.employer_name,
      location: `${job.job_city || ""}${job.job_city && job.job_country ? ", " : ""}${job.job_country || ""}` || "Remote",
      apply_link: job.job_apply_link,
      description: job.job_description,
      post_date: job.job_posted_at_datetime_utc
    }))

    return NextResponse.json({ jobs })

  } catch (error: any) {
    console.error("Job Search API Error:", error)
    return NextResponse.json({ error: error.message || "Failed to search jobs" }, { status: 500 })
  }
}
