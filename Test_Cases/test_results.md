# 🧪 Automated Test Cases Results (Divided Matrix)

This document contains individual test matrices for each automated testing layer in the system.

---

## 🧠 1. Python AI Tests (`test_ai_happy_path.py`)
*Validates the RAG spelling corrector and Levenshtein edit distance logic in the FastAPI AI service.*

* **Command**: `python -m pytest Test_Cases/test_ai_happy_path.py`

| No. | Test Case Name | Target File | Expected Behavior / Description | Status |
| :---: | :--- | :--- | :--- | :---: |
| **1** | `test_levenshtein_distance` | [test_ai_happy_path.py](file:///C:/Users/HP/Desktop/antigravity/Test_Cases/test_ai_happy_path.py) | Calculates edit distance correctly (e.g. `feedback`/`feesback` distance of 1). | **PASSED** ✅ |
| **2** | `test_is_fuzzy_match` | [test_ai_happy_path.py](file:///C:/Users/HP/Desktop/antigravity/Test_Cases/test_ai_happy_path.py) | Evaluates if word variations fall within acceptable distance thresholds (ignoring short words). | **PASSED** ✅ |
| **3** | `test_spelling_corrector` | [test_ai_happy_path.py](file:///C:/Users/HP/Desktop/antigravity/Test_Cases/test_ai_happy_path.py) | Corrects user queries with typographical errors to match knowledge base keywords. | **PASSED** ✅ |

---

## ⚙️ 2. Backend Fallback Search (`test_backend_happy_path.js`)
*Validates the Node.js database fallback search algorithms when the main AI Service is offline.*

* **Command**: `node Test_Cases/test_backend_happy_path.js`

| No. | Test Case Name | Target File | Expected Behavior / Description | Status |
| :---: | :--- | :--- | :--- | :---: |
| **1** | `Should match exact keywords in title` | [test_backend_happy_path.js](file:///C:/Users/HP/Desktop/antigravity/Test_Cases/test_backend_happy_path.js) | Returns and prioritizes article matches based on exact title terms. | **PASSED** ✅ |
| **2** | `Should resolve matching content keywords` | [test_backend_happy_path.js](file:///C:/Users/HP/Desktop/antigravity/Test_Cases/test_backend_happy_path.js) | Matches query keywords against article bodies. | **PASSED** ✅ |
| **3** | `Should sort results and use fallback` | [test_backend_happy_path.js](file:///C:/Users/HP/Desktop/antigravity/Test_Cases/test_backend_happy_path.js) | Sorts matched results by relevance density, using article effectiveness score for ties. | **PASSED** ✅ |
| **4** | `Should return empty array for empty/null` | [test_backend_happy_path.js](file:///C:/Users/HP/Desktop/antigravity/Test_Cases/test_backend_happy_path.js) | Gracefully handles empty or null search queries without throwing server exceptions. | **PASSED** ✅ |

---

## 🧪 3. Backend Vitest Search (`test_backend_search.test.js`)
*Validates backend repository query logic using Vitest mocking.*

* **Command**: `npx vitest run Test_Cases/test_backend_search.test.js`

| No. | Test Case Name | Target File | Expected Behavior / Description | Status |
| :---: | :--- | :--- | :--- | :---: |
| **1** | `should match exact keywords in title` | [test_backend_search.test.js](file:///C:/Users/HP/Desktop/antigravity/Test_Cases/test_backend_search.test.js) | Verifies title matching priority with mocked repository articles. | **PASSED** ✅ |
| **2** | `should resolve matching content keywords` | [test_backend_search.test.js](file:///C:/Users/HP/Desktop/antigravity/Test_Cases/test_backend_search.test.js) | Verifies body keyword matching with mocked repository articles. | **PASSED** ✅ |
| **3** | `should sort results by density and fallback` | [test_backend_search.test.js](file:///C:/Users/HP/Desktop/antigravity/Test_Cases/test_backend_search.test.js) | Verifies score sorting and fallback logic using Vitest mocks. | **PASSED** ✅ |

---

## 💻 4. Frontend Helper Styles (`test_frontend_helpers.test.js`)
*Validates CSS helper style resolver logic for support tickets in the React frontend.*

* **Command**: `npx vitest run Test_Cases/test_frontend_helpers.test.js`

| No. | Test Case Name | Target File | Expected Behavior / Description | Status |
| :---: | :--- | :--- | :--- | :---: |
| **1** | `should return correct styling for urgent` | [test_frontend_helpers.test.js](file:///C:/Users/HP/Desktop/antigravity/Test_Cases/test_frontend_helpers.test.js) | Verifies styling resolver outputs correct red colors for urgent tickets. | **PASSED** ✅ |
| **2** | `should return correct color for high` | [test_frontend_helpers.test.js](file:///C:/Users/HP/Desktop/antigravity/Test_Cases/test_frontend_helpers.test.js) | Verifies styling resolver outputs correct orange colors for high priority. | **PASSED** ✅ |
| **3** | `should return correct style details for resolved`| [test_frontend_helpers.test.js](file:///C:/Users/HP/Desktop/antigravity/Test_Cases/test_frontend_helpers.test.js) | Verifies badge styling resolver outputs correct green colors for resolved tickets. | **PASSED** ✅ |
