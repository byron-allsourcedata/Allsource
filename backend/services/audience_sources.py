import csv
import os
from openai import OpenAI
import logging
from persistence.audience_sources_persistence import AudienceSourcesPersistence

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
logger = logging.getLogger(__name__)

class AudienceSourceService:
    def __init__(self, audience_sources_persistence: AudienceSourcesPersistence):
        self.sources_persistence_service = audience_sources_persistence
        self.default_headings = ['Email', 'Phone number', 'Last Name', 'First Name', 'Gender', 'Age', 'Order Amount', 'State', 'City', 'Zip Code']


    def get_sources(self, page, per_page, sort_by, sort_order):
        sources, count = self.sources_persistence_service.get_sources(
            page=page,
            per_page=per_page,
            sort_by=sort_by,
            sort_order=sort_order
        )

        source_list = []
        for source in sources:

            source_list.append({
                'id': source[0],
                'source_name': source[1],
                'source_origin': source[2],
                'source_type': source[3],
                'created_date': source[4],
                'created_by': source[5],
                'updated_date': source[6],
                'total_records': source[7],
                'matched_records': source[8]
            })

        return source_list, count


    def substitution_headings(self, headers): 
        prompt = (
            "You are given a list of CSV headers and a predefined list of default headers. "
            "Map each header in the default headers to the closest matching header from the provided list. "
            "If a header is in a different language, translate it before matching. "
            "If there is no close match, return 'None' for that header. "
            "Default headers: " + ", ".join(self.default_headings) + ".\n"
            "Headers to map: " + ", ".join(headers) + ".\n"
            "The output must be a comma-separated string of exactly 10 values, corresponding strictly to the predefined default headers: "
            "" + ", ".join(self.default_headings) + ".\n"
            "Do not include any comments, explanations, or extra information."
        )
        try:
            response = client.chat.completions.create(model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful assistant skilled in data mapping."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3)

            updated_headers = response.choices[0].message.content
            return [header.strip() for header in updated_headers.split(",")]
        except Exception as e:
            logger.error("Error with ChatGPT API", exc_info=True)




