import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { role, location, experience } = await req.json()
    const apiKey = process.env.RAPIDAPI_KEY

    const searchQuery = `${role} in ${location || "Remote"} ${experience || ""}`.trim()
    
    // Fallback if no API key
    if (!apiKey) {
      return NextResponse.json({ 
        jobs: [
          { job_title: `${role} (Preview)`, company: "Demo Company", location: location || "Remote", apply_link: "#" },
          { job_title: `Senior ${role} (Preview)`, company: "Tech Corp", location: "Remote", apply_link: "#" }
        ],
        warning: "API key not configured. Showing preview data."
      })
    }

    const response = await fetch(
      `https://jsearch.p.rapidapi.com/search?query=${encodeURIComponent(searchQuery)}&num_pages=1`, 
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': apiKey,
          'X-RapidAPI-Host': 'jsearch.p.rapidapi.com'
        }
      }
    )

    if (!response.ok) {
      // Never expose raw API errors to the user
      console.error("JSearch API error:", response.status, response.statusText)
      return NextResponse.json(
        { error: "Job search is temporarily unavailable. Please try again later." }, 
        { status: 502 }
      )
    }

    const data = await response.json()
    
    if (!data.data || data.data.length === 0) {
      return NextResponse.json({ jobs: [], warning: "No jobs found for this search. Try different keywords." })
    }
    
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
    console.error("Job Search Error:", error)
    return NextResponse.json(
      { error: "Job search unavailable. Please try again later." }, 
      { status: 500 }
    )
  }
}
