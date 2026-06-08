import chromadb
from sentence_transformers import SentenceTransformer
import os

# Initialize ChromaDB
chroma_client = chromadb.PersistentClient(
    path="./chroma_db"
)

# Load embedding model
embedding_model = SentenceTransformer('all-MiniLM-L6-v2')

# Get or create collection
collection = chroma_client.get_or_create_collection(
    name="inceptrac_knowledge"
)

# Inceptrac company knowledge (dummy data — replace with real data later)
INCEPTRAC_KNOWLEDGE = [
    {
        "id": "company_profile",
        "text": """
        Inceptrac Electronics is a hardware and electronics company.
        They build real hardware products — PCB design, embedded systems,
        IoT devices, mechanical enclosures, and AI-powered hardware.
        Official recruitment email: careers@inceptrac.com
        Work mode: Full-time, On-site.
        Culture: Engineers work directly, no project managers in between.
        """,
        "type": "company_profile"
    },
    {
        "id": "role_pcb_design_engineer",
        "text": """
        PCB Design Engineer at Inceptrac Electronics.
        Full-time, On-site position.
        Job: Own the full schematic-to-Gerber flow for customer projects.
        Work directly with the engineer responsible for final build.
        Required skills: KiCad, Altium, DFM, Multi-layer PCB, PCBA.
        Domain: Electronics, PCB design, hardware manufacturing.
        """,
        "type": "job_role"
    },
    {
        "id": "role_embedded_firmware_engineer",
        "text": """
        Embedded Firmware Engineer at Inceptrac Electronics.
        Full-time, On-site position.
        Job: Write firmware that ships.
        Co-debug with hardware engineer — hardware and software never siloed.
        Required skills: ESP32, STM32, FreeRTOS, BLE, WiFi, IoT.
        Domain: Embedded systems, firmware, wireless communication, IoT.
        """,
        "type": "job_role"
    },
    {
        "id": "role_3d_mechanical_engineer",
        "text": """
        3D Design and Mechanical Engineer at Inceptrac Electronics.
        Full-time, On-site position.
        Job: Design enclosures and mechanical systems for hardware prototypes.
        Own CAD to print — understand how board inside dictates box outside.
        Required skills: SolidWorks, Fusion 360, FDM, SLA, DFM.
        Domain: Mechanical design, 3D printing, CAD, product design.
        """,
        "type": "job_role"
    },
    {
        "id": "role_ai_systems_engineer",
        "text": """
        AI Systems Engineer at Inceptrac Electronics.
        Full-time, On-site position.
        Job: Build applied AI systems for hardware products and internal tooling.
        Focus: Edge inference, sensor fusion, LLM integrations.
        This is NOT ML research — this is AI that ships in real products.
        Required skills: LLMs, Edge AI, Computer Vision, Python.
        Domain: Applied AI, edge computing, embedded AI, sensor fusion.
        """,
        "type": "job_role"
    },
    {
        "id": "tech_stack",
        "text": """
        Inceptrac Electronics technology stack:
        Hardware: KiCad, Altium, PCB design, PCBA, multi-layer boards
        Embedded: ESP32, STM32, ARM Cortex, FreeRTOS, RTOS
        Wireless: BLE, WiFi, IoT protocols, MQTT
        Mechanical: SolidWorks, Fusion 360, FDM printing, SLA printing
        AI/ML: Python, LLMs, Edge AI, Computer Vision, OpenCV
        Manufacturing: DFM, Gerber files, schematic design
        """,
        "type": "tech_stack"
    },
    {
        "id": "hiring_criteria",
        "text": """
        Inceptrac Electronics hiring criteria:
        - Hands-on engineers who build real things
        - No handoffs — engineers own their work end to end
        - Hardware and software knowledge both valued
        - Real project experience preferred over theory
        - Must be comfortable working on-site
        - Self-driven, no need for micromanagement
        - Experience with physical products preferred
        - Ability to co-debug across hardware and software
        """,
        "type": "hiring_criteria"
    }
]
def load_company_knowledge():
    # Check if already loaded
    existing = collection.count()
    if existing > 0:
        print(f"✅ Company knowledge already loaded ({existing} documents)")
        return

    print("📚 Loading Inceptrac company knowledge into ChromaDB...")

    documents = []
    ids = []
    embeddings = []
    metadatas = []

    for item in INCEPTRAC_KNOWLEDGE:
        embedding = embedding_model.encode(item["text"]).tolist()
        documents.append(item["text"])
        ids.append(item["id"])
        embeddings.append(embedding)
        metadatas.append({"type": item["type"]})

    collection.add(
        documents=documents,
        ids=ids,
        embeddings=embeddings,
        metadatas=metadatas
    )

    print(f"✅ Loaded {len(INCEPTRAC_KNOWLEDGE)} company knowledge documents!")

def query_company_knowledge(query_text: str, n_results: int = 3) -> list:
    # Search company knowledge base
    query_embedding = embedding_model.encode(query_text).tolist()

    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=n_results
    )

    return results["documents"][0] if results["documents"] else []