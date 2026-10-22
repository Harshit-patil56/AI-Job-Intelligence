"""Curated Directory of Indian Tech Unicorns, Global Employers, and IT Services.

Provides authoritative domain, industry, sector, and business model mappings.
Used by CompanyService, ingestion pipelines, and database remediation scripts.
"""

from typing import Dict, Optional, TypedDict


class CompanyProfileData(TypedDict):
    website: str
    industry: str
    sector: str  # IT, Non-IT, Unknown
    business_model: str  # PRODUCT, SERVICES, BOTH, Unknown


KNOWN_COMPANY_PROFILES: Dict[str, CompanyProfileData] = {
    # --- Indian Tech Unicorns & Startups ---
    "swiggy": {
        "website": "https://swiggy.com",
        "industry": "Food Delivery & Logistics Tech",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "zomato": {
        "website": "https://zomato.com",
        "industry": "Food Tech & Quick Commerce",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "zepto": {
        "website": "https://zeptonow.com",
        "industry": "Quick Commerce & Retail Tech",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "cred": {
        "website": "https://cred.club",
        "industry": "Fintech & Rewards",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "razorpay": {
        "website": "https://razorpay.com",
        "industry": "Fintech & Payment Gateway",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "phonepe": {
        "website": "https://phonepe.com",
        "industry": "Fintech & Digital Payments",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "paytm": {
        "website": "https://paytm.com",
        "industry": "Fintech & Consumer Finance",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "meesho": {
        "website": "https://meesho.com",
        "industry": "E-Commerce & Social Commerce",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "groww": {
        "website": "https://groww.in",
        "industry": "Fintech & Investment Tech",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "zerodha": {
        "website": "https://zerodha.com",
        "industry": "Fintech & Stockbroking",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "ola": {
        "website": "https://olacabs.com",
        "industry": "Mobility Tech & EV",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "flipkart": {
        "website": "https://flipkart.com",
        "industry": "E-Commerce",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "postman": {
        "website": "https://postman.com",
        "industry": "API Development & DevTools",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "browserstack": {
        "website": "https://browserstack.com",
        "industry": "Cloud Testing & DevTools",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "inmobi": {
        "website": "https://inmobi.com",
        "industry": "AdTech & Marketing Cloud",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "dream11": {
        "website": "https://dream11.com",
        "industry": "Gaming Tech & Sports Tech",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "urbancompany": {
        "website": "https://urbancompany.com",
        "industry": "On-Demand Home Services",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "lenskart": {
        "website": "https://lenskart.com",
        "industry": "Eyewear & Omnichannel Retail",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "delhivery": {
        "website": "https://delhivery.com",
        "industry": "Logistics & Supply Chain Tech",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "pocketfm": {
        "website": "https://pocketfm.com",
        "industry": "Audio OTT & Media Tech",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "jodo": {
        "website": "https://jodo.in",
        "industry": "Edtech & Education Fintech",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "wissentechnology": {
        "website": "https://wissen.com",
        "industry": "Enterprise IT & Banking Solutions",
        "sector": "IT",
        "business_model": "SERVICES",
    },
    "wissen": {
        "website": "https://wissen.com",
        "industry": "Enterprise IT & Banking Solutions",
        "sector": "IT",
        "business_model": "SERVICES",
    },
    "kanerika": {
        "website": "https://kanerika.com",
        "industry": "Data & AI Solutions",
        "sector": "IT",
        "business_model": "SERVICES",
    },
    "kanerikasoftware": {
        "website": "https://kanerika.com",
        "industry": "Data & AI Solutions",
        "sector": "IT",
        "business_model": "SERVICES",
    },

    # --- Top IT Services, Consulting & System Integrators in India ---
    "tcs": {
        "website": "https://tcs.com",
        "industry": "IT Services & Consulting",
        "sector": "IT",
        "business_model": "SERVICES",
    },
    "tataconsultancyservices": {
        "website": "https://tcs.com",
        "industry": "IT Services & Consulting",
        "sector": "IT",
        "business_model": "SERVICES",
    },
    "infosys": {
        "website": "https://infosys.com",
        "industry": "IT Services & Consulting",
        "sector": "IT",
        "business_model": "SERVICES",
    },
    "wipro": {
        "website": "https://wipro.com",
        "industry": "IT Services & Consulting",
        "sector": "IT",
        "business_model": "SERVICES",
    },
    "hcl": {
        "website": "https://hcltech.com",
        "industry": "IT Services & Consulting",
        "sector": "IT",
        "business_model": "SERVICES",
    },
    "hcltech": {
        "website": "https://hcltech.com",
        "industry": "IT Services & Consulting",
        "sector": "IT",
        "business_model": "SERVICES",
    },
    "techmahindra": {
        "website": "https://techmahindra.com",
        "industry": "IT Services & Telecom Solutions",
        "sector": "IT",
        "business_model": "SERVICES",
    },
    "ltimindtree": {
        "website": "https://ltimindtree.com",
        "industry": "IT Services & Digital Transformation",
        "sector": "IT",
        "business_model": "SERVICES",
    },
    "ltm": {
        "website": "https://ltimindtree.com",
        "industry": "IT Services & Digital Transformation",
        "sector": "IT",
        "business_model": "SERVICES",
    },
    "accenture": {
        "website": "https://accenture.com",
        "industry": "Management & IT Consulting",
        "sector": "IT",
        "business_model": "SERVICES",
    },
    "cognizant": {
        "website": "https://cognizant.com",
        "industry": "IT Services & Consulting",
        "sector": "IT",
        "business_model": "SERVICES",
    },
    "capgemini": {
        "website": "https://capgemini.com",
        "industry": "IT Services & Consulting",
        "sector": "IT",
        "business_model": "SERVICES",
    },
    "deloitte": {
        "website": "https://deloitte.com",
        "industry": "Audit, Consulting & Tech Advisory",
        "sector": "IT",
        "business_model": "SERVICES",
    },
    "luxoft": {
        "website": "https://luxoft.com",
        "industry": "Digital Strategy & Software Engineering",
        "sector": "IT",
        "business_model": "SERVICES",
    },
    "epamsystems": {
        "website": "https://epam.com",
        "industry": "Software Engineering & Digital Product Development",
        "sector": "IT",
        "business_model": "SERVICES",
    },
    "epam": {
        "website": "https://epam.com",
        "industry": "Software Engineering & Digital Product Development",
        "sector": "IT",
        "business_model": "SERVICES",
    },
    "birlasoft": {
        "website": "https://birlasoft.com",
        "industry": "Enterprise Digital Solutions",
        "sector": "IT",
        "business_model": "SERVICES",
    },

    # --- Global Tech, Banking & Product Companies ---
    "google": {
        "website": "https://google.com",
        "industry": "Internet & Cloud Services",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "microsoft": {
        "website": "https://microsoft.com",
        "industry": "Enterprise Software & Cloud Computing",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "meta": {
        "website": "https://meta.com",
        "industry": "Social Media, AI & Virtual Reality",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "amazon": {
        "website": "https://amazon.com",
        "industry": "E-Commerce & Cloud Computing (AWS)",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "amazoncom": {
        "website": "https://amazon.com",
        "industry": "E-Commerce & Cloud Computing (AWS)",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "apple": {
        "website": "https://apple.com",
        "industry": "Consumer Electronics & Software",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "uber": {
        "website": "https://uber.com",
        "industry": "Mobility & Delivery Platform",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "stripe": {
        "website": "https://stripe.com",
        "industry": "Global Financial Infrastructure & Payments",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "openai": {
        "website": "https://openai.com",
        "industry": "Artificial Intelligence Research & Deployment",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "canonical": {
        "website": "https://canonical.com",
        "industry": "Open Source Systems & Ubuntu Cloud Infrastructure",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "ramp": {
        "website": "https://ramp.com",
        "industry": "Corporate Finance Automation & Spend Management",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "figma": {
        "website": "https://figma.com",
        "industry": "Collaborative Design & Prototyping Software",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "datadog": {
        "website": "https://datadoghq.com",
        "industry": "Cloud Monitoring & Observability Platform",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "github": {
        "website": "https://github.com",
        "industry": "Developer Platform & Version Control",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "gitlab": {
        "website": "https://gitlab.com",
        "industry": "DevSecOps & Software Delivery Platform",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "linear": {
        "website": "https://linear.app",
        "industry": "Project Management & Issue Tracking",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "vercel": {
        "website": "https://vercel.com",
        "industry": "Cloud Platform for Frontend Developers",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "jpmorgan": {
        "website": "https://jpmorganchase.com",
        "industry": "Investment Banking & Financial Services",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "jpmorganchase": {
        "website": "https://jpmorganchase.com",
        "industry": "Investment Banking & Financial Services",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "morganstanley": {
        "website": "https://morganstanley.com",
        "industry": "Investment Banking & Wealth Management",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "amgen": {
        "website": "https://amgen.com",
        "industry": "Biotechnology & Digital Health",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "optum": {
        "website": "https://optum.com",
        "industry": "Healthcare Technology & Services",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "cornerstoneondemand": {
        "website": "https://cornerstoneondemand.com",
        "industry": "Talent Experience & HR Technology",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
    "sage": {
        "website": "https://sage.com",
        "industry": "Accounting & Enterprise Cloud Software",
        "sector": "IT",
        "business_model": "PRODUCT",
    },
}


def get_curated_company_profile(company_name: str) -> Optional[CompanyProfileData]:
    """Lookup curated profile for a company name."""
    if not company_name:
        return None
    import re
    # Clean company name
    slug = re.sub(r"[^\w]", "", company_name.lower())
    if slug in KNOWN_COMPANY_PROFILES:
        return KNOWN_COMPANY_PROFILES[slug]
    
    # Try normalized match
    norm = re.sub(r"\b(pvt|ltd|limited|inc|llc|corp|technologies|solutions|services|software)\b", "", company_name.lower())
    norm_slug = re.sub(r"[^\w]", "", norm)
    return KNOWN_COMPANY_PROFILES.get(norm_slug)
