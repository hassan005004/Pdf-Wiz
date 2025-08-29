# Overview

This is a web-based PDF manipulation tool that provides various PDF processing capabilities including merging, splitting, extracting pages, rotating, and compressing PDF files. The application features a clean, modern interface with a sidebar navigation for different PDF operations and supports drag-and-drop file uploads.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Static Web Interface**: Uses vanilla HTML, CSS, and JavaScript with TailwindCSS for styling
- **Single Page Application**: All functionality contained in one HTML page with dynamic content switching
- **File Handling**: Drag-and-drop file upload interface with visual feedback
- **Responsive Design**: Mobile-friendly interface using TailwindCSS utility classes

## Backend Architecture
- **FastAPI Framework**: Python-based REST API server providing PDF processing endpoints
- **File Storage**: Local filesystem storage with separate directories for uploads and outputs
- **PDF Processing**: Dedicated PDFProcessor class handling core PDF manipulation operations
- **CORS Support**: Configured to allow cross-origin requests for web interface

## Core Components
- **PDFProcessor Class**: Centralized PDF manipulation logic using PyPDF2 library
- **File Management**: Automatic cleanup utility for managing temporary files
- **Error Handling**: Comprehensive exception handling for file operations
- **Background Tasks**: Support for long-running operations without blocking requests

## Data Flow
1. Files uploaded through web interface to `/uploads` directory
2. FastAPI processes requests and delegates to PDFProcessor
3. Processed files saved to `/outputs` directory
4. Results returned as downloadable files or JSON responses

# External Dependencies

## Core Libraries
- **FastAPI**: Web framework for building the REST API
- **PyPDF2**: PDF manipulation and processing library
- **Pillow (PIL)**: Image processing for PDF-to-image conversion
- **Uvicorn**: ASGI server for running FastAPI applications

## Frontend Dependencies
- **TailwindCSS**: Utility-first CSS framework via CDN
- **Font Awesome**: Icon library for UI elements

## File System
- **Local Storage**: Uses local filesystem for file uploads and outputs
- **Cleanup System**: Automated file cleanup to prevent storage bloat
- **Directory Structure**: Organized with separate upload and output directories