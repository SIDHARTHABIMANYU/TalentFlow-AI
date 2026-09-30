# Talentflow-AI Recruitment System 

A production AI recruitment platform, live , that automates resume screening end-to-end.

## Problem

Recruiters manually screened every resume from the inbox, causing delays and inconsistent shortlisting decisions.

## Solution

Built a fully automated pipeline that ingests, processes, and scores every job application without manual intervention:
- Celery Beat polls Gmail IMAP on a schedule to catch new job application emails automatically
- A hybrid OCR pipeline (Tesseract OCR + PyPDF2/pdfplumber) extracts text from both digital and scanned resumes
- Gemini 2.0 Flash parses extracted text into structured candidate data
- A 4-layer matching engine (exact match, partial match, synonym dictionary, Sentence-Transformer cosine similarity) scores candidates against job requirements
- ChromaDB adds company-context-aware RAG matching on top of keyword/semantic scoring
- Recruiters get Telegram inline-approve buttons — a single click sends the candidate email automatically (human-in-the-loop)
- A React/Vite dashboard (Google OAuth, JWT-secured routes) shows every candidate's status in real time

## Architecture

Gmail IMAP → Celery Beat (scheduled polling) → Hybrid OCR (Tesseract + PyPDF2/pdfplumber) → Gemini 2.0 Flash (structured parsing) → 4-Layer Matching Engine + ChromaDB RAG → PostgreSQL (candidate records) → Telegram (inline approve/reject) + React/Vite Dashboard (Google OAuth, JWT)

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI |
| Task Queue | Celery, Celery Beat, Redis |
| Database | PostgreSQL, ChromaDB |
| AI / Parsing | Gemini 2.0 Flash, Sentence Transformers (all-MiniLM-L6-v2) |
| OCR | Tesseract OCR, PyPDF2, pdfplumber |
| Frontend | React, Vite |
| Auth | Google OAuth 2.0, JWT |
| Notifications | Telegram Bot API (inline approval) |
| Infra | Docker Compose (6 containers), AWS EC2, Nginx, Let's Encrypt |

## Key Features

- Zero manual intervention — email to structured candidate record in under 30 seconds
- Hybrid OCR — handles both clean digital PDFs and scanned/image-based resumes
- 4-layer matching — combines keyword, synonym, and semantic similarity for reliable 0-100% fit scores
- Human-in-the-loop approval — recruiters approve/reject with a single click, action executes automatically
- Real-time dashboard — live candidate status, SHORTLIST/CONSIDER/REJECT recommendations

## Setup

Clone the repo, then run: docker-compose up --build

## Environment Variables

Requires Gmail IMAP credentials, Gemini API key, PostgreSQL connection, and Google OAuth client credentials — see .env.example. None of these are committed to this repository.

## Status

Built and deployed as part of an AI Engineering internship at Spinacle Technologies, in production use by a real client.
