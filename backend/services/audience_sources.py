import csv
import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
import logging
from persistence.audience_sources_persistence import AudienceSourcesPersistence

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
        # prompt = (
        #     "You are given a list of CSV headers. Map these headers to the closest matching default headers. "
        #     "Default headers: "
        #     + ", ".join(self.default_headings) + ".\n"
        #     "Headers to map: " + ", ".join(headers) + ".\n"
        #     "Return the updated list where each header is replaced by its closest match."
        # )
        # prompt = (
        #     "You are given a list of default headers and a list of CSV headers. "
        #     "For each default header, find the closest matching CSV header from the provided list. "
        #     "If no reasonable match exists, keep the default header unchanged. "
        #     "\n\nDefault headers: "
        #     f"{', '.join(self.default_headings)}.\n\n"
        #     f"CSV headers: {', '.join(headers)}.\n\n"
        #     "Return a JSON object where each default header is mapped to its closest matching CSV header."
        # )

        prompt = (
            "You are given a list of CSV headers and a predefined list of default headers. "
            "For each header in the provided list, find the closest match from the default headers. "
            # "If there is no close match, keep the original header. "
            "If there is no close match, return None. "
            "Use strict matching logic to ensure accuracy. "
            "Default headers: "
            + ", ".join(self.default_headings) + ".\n"
            "Headers to map: " + ", ".join(headers) + ".\n"
            "Return the updated headers as a comma-separated list where each input header "
            "is replaced by its closest match from the default headers."
        )

        try:
            response = client.chat.completions.create(model="gpt-4",
            messages=[
                {"role": "system", "content": "You are a helpful assistant skilled in data mapping."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3)

            updated_headers = response.choices[0].message.content
            print(updated_headers.split(","))
            return [header.strip() for header in updated_headers.split(",")]
        except Exception as e:
            logger.error("Error with ChatGPT API", exc_info=True)




