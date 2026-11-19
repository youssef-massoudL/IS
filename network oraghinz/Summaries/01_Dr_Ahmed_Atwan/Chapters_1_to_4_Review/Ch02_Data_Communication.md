# Chapter 2: Data Communication (Dr. Ahmed Atwan)

*Source: `01_Dr_Ahmed_Atwan/Chapters_1_to_4_Review/Ch02_Data_Communication.pdf` (Book pp. 22–47)*

---

## 1. Data Communication Modes
1. **Simplex:** Data flows in **one direction only** (e.g., space probe sending images to Earth).
2. **Half-Duplex (Two-way alternate):** Data flows in **both directions, but alternately** (one at a time).
3. **Full-Duplex:** Data flows in **both directions simultaneously** (e.g., telephony).
4. **Broadcast:** Sender's output is received by **all** receivers on the network (e.g., cable TV).
5. **Multicast:** Sender's data is received by a **specific subset/group** of receivers (e.g., video conferencing).

- **Symmetrical vs. Asymmetrical flow:** Equal data rate in both directions = **symmetrical** (e.g., video phone); different rates = **asymmetrical** (e.g., web browsing: low upload request, high download response).

---

## 2. Switching Techniques

| Type | How It Works | Key Details / Examples |
| :--- | :--- | :--- |
| **Circuit Switching** | Establishes a dedicated path/connection between sender and receiver *before* sending data. | Suffers from connection-setup delay. Examples: **PSTN**, **ISDN**. |
| **Packet Switching (Connection-Oriented, CO)** | Sets up a **Virtual Circuit (VC)** through Packet-Switching Exchanges (PSEs) before sending packets; uses only part of link bandwidth. | Uses Virtual Circuit Identifiers (VCI) in routing tables. |
| **Packet Switching (Connectionless, CL)** | No connection setup required. Each packet carries **full source and destination addresses** in its header and is routed independently by PSEs. | Flexible, no setup delay. |

---

## 3. Transmission Media

### A. Twisted Pair (UTP & STP)
- **UTP (Unshielded Twisted Pair):** 4 pairs of twisted wires (twisting reduces crosstalk/interference); uses **RJ-45** connector; governed by **EIA/TIA** standards.
- **STP (Shielded Twisted Pair):** Adds shielding against electrical/RF interference (used in Token Ring or noisy environments).

| UTP Category | Max Data Rate | Max Length | Common Use |
| :--- | :--- | :--- | :--- |
| **CAT 1** | Up to 1 Mbps | — | Old telephone cable |
| **CAT 2** | Up to 4 Mbps | — | Token Ring |
| **CAT 3** | Up to 10 Mbps | 100 m | Token Ring, 10BASE-T Ethernet |
| **CAT 4** | Up to 16 Mbps | 100 m | Token Ring |
| **CAT 5** | Up to 100 Mbps | 100 m | Ethernet, FastEthernet, Token Ring |
| **CAT 5e** | Up to 1 Gbps | 100 m | FastEthernet, Gigabit Ethernet |
| **CAT 6 / 6a** | Up to 10 Gbps | 100 m (55 m for 10G) | Gigabit / 10G Ethernet |
| **CAT 7** | Up to 10 Gbps | 100 m (100 m for 10G) | Gigabit / 10G Ethernet |

### B. Coaxial Cable
- Structure: Center copper conductor + plastic dielectric insulation + metal shielding braid + outer cover. Resistant to interference.
- **Thin Coax (`10Base2`):** Max segment length **200 m** (summary table notes 185 m), used in linear bus networks.
- **Thick Coax (`10Base5` / Thicknet):** Max segment length **500 m**, better moisture protection, longer runs.
- **Connector:** **BNC connector** (with T-connectors, barrel connectors, and terminating resistors).

### C. Optical Fiber Cable
- Carries **light** through a glass core surrounded by cladding (lower refractive index) → immune to electrical noise and moisture, longest distances, highest speeds (`10BaseF`).
- **Transmitter:** LED or Laser Diode (LD). **Receiver:** Photodiode or phototransistor.
- **Propagation Modes:**
  1. **Multimode Stepped Index:** Constant core index; suffers from pulse **dispersion** (wider output pulse, lower rate); uses inexpensive LEDs.
  2. **Multimode Graded Index:** Variable refractive index; reduces dispersion compared to stepped index.
  3. **Single-Mode (Monomode):** Very narrow core, minimal dispersion; uses **LDs**; hundreds of Mbps+.
- **WDM (Wavelength Division Multiplexing):** Sends multiple channels on different wavelengths over the same fiber → tens of Gbps+.
- **Connectors:** **ST** (Straight Tip) and **SC** (popular for confined spaces).

### D. Wireless / Space Media
- **Satellites:** Receive ground microwave beams and relay via **transponders** (each covering a frequency band); ~500 MHz bandwidth, hundreds of high-speed links using **TDM**.
- **Microwave Links:** Used when physical cabling is too costly or impractical.

---

## 4. Ethernet Cable Wiring Types
1. **Straight-Through Cable:** Connects **unlike** devices (Router ↔ Switch/Hub, Host ↔ Switch/Hub).
2. **Crossover Cable:** Connects **like** devices (Switch ↔ Switch, Hub ↔ Hub, Host ↔ Host, Hub ↔ Switch, Router ↔ Host directly).
3. **Rolled (Console) Cable:** Connects a **Host** to a **Router console serial port (COM)**.

### Ethernet Specification Summary
| Specification | Cable Type | Max Length |
| :--- | :--- | :--- |
| `10BaseT` | UTP | 100 m |
| `10Base2` | Thin Coaxial | 185 m |
| `10Base5` | Thick Coaxial | 500 m |
| `10BaseF` | Fiber Optic | 2000 m |
| `100BaseT` | UTP | 100 m |
| `100BaseTX` | UTP | 220 m |
