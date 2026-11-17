# Chapter 3: Network Hardware & Local Area Networks (Dr. Ahmed Atwan)

*Source: `01_Dr_Ahmed_Atwan/Chapters_1_to_4_Review/Ch03_Network_Hardware_and_LAN.pdf` (Book pp. 48–79)*

---

## 1. Network Hardware Devices
- **File Server:** Heart of the network; powerful computer with large RAM/storage, NIC, and Network OS; manages shared files, apps, and communication.
- **Workstations:** Client computers connected to the network with a NIC, network software, and cables.
- **Network Interface Card (NIC):** Provides the physical connection between computer and network; major factor in network speed.
  - **Ethernet NICs:** Use **RJ-45** (twisted pair), **BNC** (coaxial), or **AUI**.
  - **Token Ring NICs:** Use **DIN 9-pin** connector.
- **Repeater:** Amplifies/regenerates weak signals to extend cable length beyond standard limits (e.g., UTP 100 m limit).
- **Bridge:** Segments a large network into smaller **collision domains**; learns MAC addresses on each side and filters/forwards traffic accordingly; can connect different wiring types.
- **Switch:** Multi-port intelligent device (typically 8, 12, or 24 RJ-45 ports) used in Star/Tree topologies. Unlike hubs, it inspects source/destination hardware (MAC) addresses, **filters** intra-segment traffic, **forwards** inter-segment traffic to the right port only, and drops bad frames.
- **Router:** Operates at the **Network Layer (Layer 3)**; forwards packets between different networks using **destination IP addresses** and **routing tables**.
  - Uses routing protocols (**RIP**, **OSPF**, **BGP**) to dynamically update routing tables.
  - Performs **NAT** (private ↔ public IP translation) and **firewalling**.
  - Connects diverse interfaces (Ethernet, Wi-Fi, WAN).

---

## 2. Network Topologies

| Topology | Structure | Advantages | Disadvantages |
| :--- | :--- | :--- | :--- |
| **Bus** | Single linear backbone cable with **terminators** at both ends. | Less cable than Star; easy to connect devices. | Break in main cable brings down entire network; needs terminators; hard to troubleshoot; not for large buildings. |
| **Ring** | Nodes connected in a closed loop; data passes node-to-node (e.g., **Token Ring**, **FDDI** dual counter-rotating rings). | Better performance under heavy load; no central server needed. | Single link/node failure disrupts network (unless dual-ring FDDI); adds/moves affect whole network; slower than Ethernet. |
| **Star** | All nodes connect to a central **hub, switch, or router** (commonly UTP + Ethernet). | Easy to install, add/remove nodes, and isolate faults; single cable failure doesn't stop network. | Requires more cable than Bus; more expensive; if central hub/switch fails, all connected nodes fail. |
| **Tree** | Multiple **Star** topologies linked together via a **Bus** backbone. | Point-to-point wiring per segment; scalable; widely supported. | Main backbone damage fails entire segment; segment size limited by cabling; harder to install. |
| **Mesh** | Every node connects directly to **every other node**. | High fault tolerance (alternate paths if a cable fails). | Requires the most cabling; most expensive. |

**Choosing a Topology:**
- **Cable length:** Bus uses shortest cable.
- **Scalability:** Star is simplest to expand.
- **Most common cabling:** UTP in Star topology.

---

## 3. Local Area Networks (LANs)
- Covers a floor, building, or campus (up to a few km); modern speeds: **100 Mbps, 1 Gbps, up to 10 Gbps**.
- **Standards:**
  - **Wired LAN:** **IEEE 802.3** (Ethernet).
  - **Wireless LAN:** **IEEE 802.11** (Wi-Fi) via **Access Points (APs)**.
- **Connectors:**
  - **RJ-11:** Telephone lines, modems, faxes.
  - **RJ-45:** Network adapters, `10BaseT`, ISDN lines.

---

## 4. Bandwidth vs. Throughput
- **Bandwidth:** Difference between the highest and lowest frequencies (measured in **MHz**).
- **Throughput Rate:** Actual rate of data passing through a point in the network (bps / Mbps / Gbps). Higher throughput drastically reduces transmission time (e.g., 9.6 kbps = 12.27 hrs vs. 1 Gbps = 0.42 sec for the same data).
