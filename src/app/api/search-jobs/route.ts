import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { role, location, experience } = await req.json()
    const apiKey = process.env.RAPIDAPI_KEY

    // FALLBACK DATA (High Quality Demo)
    const mockJobs = [
      { job_title: `${role} (Executive Role)`, company: "Starlight Corp", location: location || "Remote", apply_link: "https://example.com/apply-1" },
      { job_title: `Senior ${role} Specialist`, company: "Global Tech", location: location || "Remote", apply_link: "https://example.com/apply-2" },
      { job_title: `Lead ${role} (AI Focus)`, company: "Future Systems", location: "Hybrid", apply_link: "https://example.com/apply-3" },
      { job_title: `${role} Infrastructure`, company: "Cloud Matrix", location: location || "San Francisco", apply_link: "https://example.com/apply-4" }
    ]

    const searchQuery = `${role} in ${location || "Remote"} ${experience || ""}`.trim()
    
    if (!apiKey || apiKey === "your_api_key_here") {
      return NextResponse.json({ 
        jobs: mockJobs.slice(0, 2),
        warning: "Demo Mode: API key not configured. Showing sample opportunities."
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
      console.error("JSearch API error:", response.status)
      // Return mock data with a professional notice if API fails (e.g. 403/429)
      return NextResponse.json({ 
        jobs: mockJobs,
        warning: "API connection limited. Displaying curated preview opportunities."
      })
    }

    const data = await response.json()
    
    if (!data.data || data.data.length === 0) {
      return NextResponse.json({ jobs: [], warning: "No live matches found. Try broadening your criteria." })
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
    console.error("Job Search Route Error:", error)
    return NextResponse.json(
      { error: "Searching is temporarily limited. Please try again in a few minutes." }, 
      { status: 500 }
    )
  }
}
