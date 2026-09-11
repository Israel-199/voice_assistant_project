import os
import json
import re
import numpy as np
from typing import List, Dict, Any
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

class RAGEngine:
    def __init__(self, data_path: str = None):
        if data_path is None:
            base_dir = os.path.dirname(os.path.abspath(__file__))
            data_path = os.path.join(base_dir, "data", "knowledge_base.json")
            
        self.data_path = data_path
        self.documents = []
        self.vectorizer = None
        self.doc_vectors = None
        self.load_and_index()

    def load_and_index(self):
        """Loads knowledge base documents and builds TF-IDF vector index."""
        if not os.path.exists(self.data_path):
            raise FileNotFoundError(f"Knowledge base file not found at {self.data_path}")
            
        with open(self.data_path, "r", encoding="utf-8") as f:
            self.documents = json.load(f)

        # Prepare corpus from title + category + content
        corpus = [
            f"{doc.get('title', '')} {doc.get('category', '')} {doc.get('content', '')}"
            for doc in self.documents
        ]

        self.vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
        self.doc_vectors = self.vectorizer.fit_transform(corpus)
        print(f"RAG Engine: Successfully indexed {len(self.documents)} documents.")

    def search(self, query: str, top_k: int = 3) -> List[Dict[str, Any]]:
        """Retrieves top_k relevant documents using cosine similarity vector search."""
        if not query or not query.strip():
            return []

        query_vec = self.vectorizer.transform([query])
        similarities = cosine_similarity(query_vec, self.doc_vectors).flatten()

        # Sort indices by score descending
        top_indices = np.argsort(similarities)[::-1][:top_k]

        results = []
        for idx in top_indices:
            score = float(similarities[idx])
            doc = self.documents[idx]
            
            # Format similarity score as percentage
            score_pct = round(score * 100, 1)
            
            results.append({
                "id": doc.get("id"),
                "title": doc.get("title"),
                "category": doc.get("category"),
                "content": doc.get("content"),
                "similarity_score": score,
                "similarity_pct": f"{score_pct}%",
                "citation": f"[{doc.get('id')}] {doc.get('title')}"
            })
            
        return results

    def add_document(self, title: str, category: str, content: str) -> Dict[str, Any]:
        """Adds a new document to the knowledge base and re-indexes."""
        new_id = f"DOC-{len(self.documents) + 1:03d}"
        new_doc = {
            "id": new_id,
            "title": title,
            "category": category,
            "content": content
        }
        self.documents.append(new_doc)
        
        # Save to disk
        with open(self.data_path, "w", encoding="utf-8") as f:
            json.dump(self.documents, f, indent=2)
            
        # Re-index
        self.load_and_index()
        return new_doc

    def generate_grounded_response(self, query: str, retrieved_chunks: List[Dict[str, Any]], provider: str = "local") -> Dict[str, Any]:
        """Generates grounded Captain response from retrieved RAG context."""
        
        if not retrieved_chunks or (retrieved_chunks and retrieved_chunks[0]['similarity_score'] < 0.05):
            response_text = (
                "Captain, I searched our ship's database and technical manuals, but I found no relevant protocol "
                "or procedure matching your exact query. Please specify a standard operational command or consult command deck manual."
            )
            return {
                "response": response_text,
                "grounded": False,
                "provider": provider,
                "citations": []
            }

        top_chunk = retrieved_chunks[0]
        context_str = "\n\n".join([
            f"Document {c['id']} ({c['title']}): {c['content']}"
            for c in retrieved_chunks
        ])

        citations = [f"[{c['id']}]" for c in retrieved_chunks if c['similarity_score'] > 0.05]

        # Check for external API keys if provider is selected
        gemini_key = os.getenv("GEMINI_API_KEY")
        groq_key = os.getenv("GROQ_API_KEY")

        if provider == "gemini" and gemini_key:
            try:
                import importlib
                genai = importlib.import_module("google.generativeai")
                genai.configure(api_key=gemini_key)
                model = genai.GenerativeModel('gemini-1.5-flash')
                prompt = (
                    f"You are the Ship AI Assistant addressing the Captain. Ground your answer ONLY in the following ship manuals:\n"
                    f"{context_str}\n\n"
                    f"Captain's Query: {query}\n\n"
                    f"Provide an authoritative, clear, grounded response citing relevant document IDs."
                )
                res = model.generate_content(prompt)
                return {
                    "response": res.text,
                    "grounded": True,
                    "provider": "gemini",
                    "citations": citations
                }
            except Exception as e:
                print(f"Gemini API failed, falling back to local synthesizer: {e}")

        # Local Grounded Synthesizer (100% Free, Offline, Reliable)
        # Synthesize clear authoritative response using top matching document
        primary_title = top_chunk['title']
        primary_content = top_chunk['content']
        primary_id = top_chunk['id']

        # Extract sentences from top document
        sentences = [s.strip() for s in re.split(r'\.\s+', primary_content) if s.strip()]
        
        greeting = f"Captain, regarding your request on '{primary_title}':"
        core_facts = " ".join(sentences)
        
        response_text = (
            f"{greeting} According to protocol [{primary_id}], {core_facts}. "
            f"All operations must adhere strictly to these parameters."
        )

        return {
            "response": response_text,
            "grounded": True,
            "provider": "local",
            "citations": citations,
            "context_used": context_str
        }
