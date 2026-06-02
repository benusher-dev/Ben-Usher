import { useState, useEffect, useRef } from "react";
import {
  Activity, Calculator, Terminal, Server, FileCode2, Gauge as GaugeIcon,
  Plus, Trash2, Copy, Search, Play, Check, Network, ChevronRight, Cpu, ShieldCheck,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  IP / subnet maths                                                  */
/* ------------------------------------------------------------------ */
const ipToInt = (ip) => {
  const p = String(ip).trim().split(".");
  if (p.length !== 4) return null;
  let n = 0;
  for (const o of p) {
    const x = Number(o);
    if (!Number.isInteger(x) || x < 0 || x > 255) return null;
    n = (n << 8) | x;
  }
  return n >>> 0;
};
const intToIp = (n) =>
  [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
const cidrToMask = (c) => (c === 0 ? 0 : (0xffffffff << (32 - c)) >>> 0);
const ipToBinary = (n) =>
  [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255]
    .map((o) => o.toString(2).padStart(8, "0"))
    .join(".");

const parseCidr = (str) => {
  const [ipPart, cidrPart] = String(str).trim().split("/");
  const ip = ipToInt(ipPart);
  if (ip === null) return null;
  const cidr = cidrPart === undefined ? null : Number(cidrPart);
  if (cidr === null || !Number.isInteger(cidr) || cidr < 0 || cidr > 32) return null;
  return { ip, cidr };
};

const ipClass = (n) => {
  const f = (n >>> 24) & 255;
  if (f < 128) return "A";
  if (f < 192) return "B";
  if (f < 224) return "C";
  if (f < 240) return "D (multicast)";
  return "E (experimental)";
};
const scope = (n) => {
  const a = (n >>> 24) & 255, b = (n >>> 16) & 255;
  if (a === 10) return "Private (RFC1918)";
  if (a === 172 && b >= 16 && b <= 31) return "Private (RFC1918)";
  if (a === 192 && b === 168) return "Private (RFC1918)";
  if (a === 127) return "Loopback";
  if (a === 169 && b === 254) return "Link-local (APIPA)";
  return "Public";
};

const calcSubnet = (ip, cidr) => {
  const mask = cidrToMask(cidr);
  const network = (ip & mask) >>> 0;
  const broadcast = (network | (~mask >>> 0)) >>> 0;
  const wildcard = (~mask) >>> 0;
  const total = Math.pow(2, 32 - cidr);
  let usable, first, last;
  if (cidr === 32) { usable = 1; first = network; last = network; }
  else if (cidr === 31) { usable = 2; first = network; last = broadcast; }
  else { usable = total - 2; first = (network + 1) >>> 0; last = (broadcast - 1) >>> 0; }
  return {
    network: intToIp(network), broadcast: intToIp(broadcast),
    first: intToIp(first), last: intToIp(last),
    mask: intToIp(mask), wildcard: intToIp(wildcard),
    cidr, total, usable, binary: ipToBinary(mask),
    cls: ipClass(ip), scope: scope(network),
  };
};

const prefixForHosts = (hosts) => {
  for (let bits = 1; bits <= 32; bits++) {
    if (Math.pow(2, bits) - 2 >= hosts) return 32 - bits;
  }
  return null;
};

const allocateVlsm = (baseStr, requests) => {
  const parsed = parseCidr(baseStr);
  if (!parsed) return { error: "Invalid base network — use e.g. 10.0.0.0/16" };
  const baseNet = (parsed.ip & cidrToMask(parsed.cidr)) >>> 0;
  const baseEnd = baseNet + Math.pow(2, 32 - parsed.cidr) - 1;
  const sorted = [...requests].sort((a, b) => b.hosts - a.hosts);
  let cursor = baseNet;
  const out = [];
  for (const r of sorted) {
    const prefix = prefixForHosts(r.hosts);
    if (prefix === null) { out.push({ ...r, error: "too large" }); continue; }
    const block = Math.pow(2, 32 - prefix);
    const aligned = Math.ceil(cursor / block) * block;
    if (aligned + block - 1 > baseEnd) { out.push({ ...r, prefix, error: "does not fit" }); continue; }
    out.push({
      name: r.name, hosts: r.hosts, prefix,
      network: intToIp(aligned >>> 0),
      broadcast: intToIp((aligned + block - 1) >>> 0),
      first: intToIp((aligned + 1) >>> 0),
      last: intToIp((aligned + block - 2) >>> 0),
      mask: intToIp(cidrToMask(prefix)),
      usable: block - 2,
    });
    cursor = aligned + block;
  }
  return { subnets: out };
};

/* ------------------------------------------------------------------ */
/*  Reference data                                                     */
/* ------------------------------------------------------------------ */
const COMMANDS = [
  { cat: "Show", cmd: "show running-config", desc: "Display the active configuration" },
  { cat: "Show", cmd: "show ip interface brief", desc: "Summary of interfaces, IPs and status" },
  { cat: "Show", cmd: "show interfaces status", desc: "Switch port status, VLAN, duplex, speed" },
  { cat: "Show", cmd: "show ip route", desc: "Display the IPv4 routing table" },
  { cat: "Show", cmd: "show ip protocols", desc: "Active routing protocols and parameters" },
  { cat: "Show", cmd: "show ip ospf neighbor", desc: "OSPF adjacencies and their states" },
  { cat: "Show", cmd: "show ip ospf interface brief", desc: "OSPF interfaces, area and cost" },
  { cat: "Show", cmd: "show ip bgp summary", desc: "BGP neighbours and session state" },
  { cat: "Show", cmd: "show cdp neighbors detail", desc: "Directly connected Cisco devices" },
  { cat: "Show", cmd: "show vlan brief", desc: "VLANs and assigned access ports" },
  { cat: "Show", cmd: "show mac address-table", desc: "Learned MACs per port / VLAN" },
  { cat: "Show", cmd: "show version", desc: "IOS version, uptime, hardware, licence" },
  { cat: "Show", cmd: "show license udi", desc: "Unique Device Identifier for licensing" },
  { cat: "Config", cmd: "configure terminal", desc: "Enter global configuration mode" },
  { cat: "Config", cmd: "interface gigabitEthernet0/0", desc: "Enter interface configuration" },
  { cat: "Config", cmd: "ip address 10.0.0.1 255.255.255.0", desc: "Assign an IPv4 address" },
  { cat: "Config", cmd: "no shutdown", desc: "Administratively enable the interface" },
  { cat: "Config", cmd: "switchport mode access", desc: "Set port to access mode" },
  { cat: "Config", cmd: "switchport access vlan 10", desc: "Assign access port to a VLAN" },
  { cat: "Config", cmd: "switchport mode trunk", desc: "Set port to 802.1Q trunk mode" },
  { cat: "Config", cmd: "router ospf 1", desc: "Enter OSPF process configuration" },
  { cat: "Config", cmd: "network 10.0.0.0 0.0.0.255 area 0", desc: "Advertise into OSPF (wildcard!)" },
  { cat: "Licence", cmd: "license boot level securityk9", desc: "IOS XE: select securityk9 package, reload" },
  { cat: "Licence", cmd: "license boot module c900 technology-package securityk9", desc: "Classic IOS (ISR 900) securityk9 RTU" },
  { cat: "Licence", cmd: "license accept end user agreement", desc: "Accept EULA for EvalRightToUse licences" },
  { cat: "Save", cmd: "write memory", desc: "Save running-config to startup-config" },
  { cat: "Recovery", cmd: "confreg 0x2142", desc: "ROMmon: ignore startup-config for recovery" },
];

const PORTS = [
  ["20/21", "TCP", "FTP"], ["22", "TCP", "SSH"], ["23", "TCP", "Telnet"],
  ["25", "TCP", "SMTP"], ["53", "TCP/UDP", "DNS"], ["67/68", "UDP", "DHCP"],
  ["69", "UDP", "TFTP"], ["80", "TCP", "HTTP"], ["110", "TCP", "POP3"],
  ["123", "UDP", "NTP"], ["143", "TCP", "IMAP"], ["161/162", "UDP", "SNMP"],
  ["179", "TCP", "BGP"], ["389", "TCP/UDP", "LDAP"], ["443", "TCP", "HTTPS"],
  ["500", "UDP", "ISAKMP / IKE"], ["514", "UDP", "Syslog"], ["636", "TCP", "LDAPS"],
  ["4500", "UDP", "IPsec NAT-T"], ["3389", "TCP", "RDP"],
];

const PROTOCOLS = [
  {
    name: "OSPF", ad: "110", type: "Link-state", metric: "Cost (10⁸ / bw)",
    states: "Down → Init → 2-Way → ExStart → Exchange → Loading → Full",
    fails: "Mismatched hello/dead timers, area ID, subnet/mask, MTU, authentication, stub/NSSA flags, duplicate Router-ID, or an ACL blocking 224.0.0.5/6.",
  },
  {
    name: "EIGRP", ad: "90 int / 170 ext", type: "Adv. distance-vector (DUAL)", metric: "Bandwidth + delay (K-values)",
    states: "Neighbour table built via Hellos; DUAL picks successor / feasible successor",
    fails: "Mismatched AS number, K-values, authentication, or no common subnet.",
  },
  {
    name: "BGP", ad: "20 eBGP / 200 iBGP", type: "Path-vector", metric: "Path attributes (AS-Path, LP, MED…)",
    states: "Idle → Connect → Active → OpenSent → OpenConfirm → Established",
    fails: "No reachability to neighbour, wrong remote-AS, TCP 179 blocked, or missing update-source on loopback peering.",
  },
];

/* ------------------------------------------------------------------ */
/*  Small UI helpers                                                   */
/* ------------------------------------------------------------------ */
const KV = ({ k, v, accent }) => (
  <div className="flex items-center justify-between gap-3 py-1 border-b" style={{ borderColor: "var(--border)" }}>
    <span className="nd-head text-xs" style={{ color: "var(--muted)" }}>{k}</span>
    <span className="text-sm" style={{ color: accent ? "var(--green)" : "var(--text)", fontFamily: "var(--mono)" }}>{v}</span>
  </div>
);

const Panel = ({ title, icon: Icon, children, delay = 0 }) => (
  <section className="nd-panel nd-fade p-4" style={{ animationDelay: `${delay}ms` }}>
    {title && (
      <header className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: "1px solid var(--border)" }}>
        {Icon && <Icon size={15} style={{ color: "var(--green)" }} />}
        <h2 className="nd-head text-sm" style={{ color: "var(--text)", letterSpacing: "-0.01em" }}>{title}</h2>
      </header>
    )}
    {children}
  </section>
);

const Input = (props) => <input {...props} className={"nd-input px-2 py-1 text-sm w-full " + (props.className || "")} />;

const Btn = ({ children, onClick, kind }) => (
  <button onClick={onClick} className={"px-3 py-1.5 text-xs nd-head flex items-center justify-center gap-1.5 " + (kind === "ghost" ? "nd-btn-ghost" : "nd-btn")}>
    {children}
  </button>
);

/* ------------------------------------------------------------------ */
/*  Subnet / VLSM                                                      */
/* ------------------------------------------------------------------ */
function SubnetTool() {
  const [val, setVal] = useState("192.168.10.0/26");
  const parsed = parseCidr(val);
  const r = parsed ? calcSubnet(parsed.ip, parsed.cidr) : null;

  const [base, setBase] = useState("10.20.0.0/22");
  const [req, setReq] = useState("Sales = 100\nEngineering = 50\nOps = 25\nWAN link = 2");
  const [vlsm, setVlsm] = useState(null);
  const runVlsm = () => {
    const requests = req.split("\n").map((l) => l.trim()).filter(Boolean).map((l, i) => {
      const m = l.split(/[,=:]/);
      if (m.length >= 2) return { name: m[0].trim(), hosts: Number(m[1].trim()) };
      const n = Number(l);
      return Number.isFinite(n) ? { name: `Subnet ${i + 1}`, hosts: n } : null;
    }).filter((x) => x && Number.isFinite(x.hosts) && x.hosts > 0);
    setVlsm(allocateVlsm(base, requests));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title="Subnet Calculator" icon={Calculator}>
        <label className="nd-head text-xs block mb-1" style={{ color: "var(--muted)" }}>IP / CIDR</label>
        <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder="10.0.0.0/24" />
        {!r ? (
          <p className="text-xs mt-3" style={{ color: "var(--amber)" }}>Enter a valid address, e.g. 172.16.4.0/20</p>
        ) : (
          <div className="mt-3">
            <KV k="Network" v={`${r.network}/${r.cidr}`} accent />
            <KV k="Broadcast" v={r.broadcast} />
            <KV k="Usable range" v={`${r.first} – ${r.last}`} />
            <KV k="Subnet mask" v={r.mask} />
            <KV k="Wildcard" v={r.wildcard} accent />
            <KV k="Usable hosts" v={r.usable.toLocaleString()} />
            <KV k="Total addresses" v={r.total.toLocaleString()} />
            <KV k="Class / scope" v={`${r.cls} · ${r.scope}`} />
            <div className="mt-2 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
              <span className="nd-head text-xs" style={{ color: "var(--muted)" }}>Mask (binary)</span>
              <div className="text-xs mt-1" style={{ color: "var(--green)", wordBreak: "break-all" }}>{r.binary}</div>
            </div>
          </div>
        )}
      </Panel>

      <Panel title="VLSM Planner" icon={Network} delay={80}>
        <div className="grid grid-cols-1 gap-2">
          <div>
            <label className="nd-head text-xs block mb-1" style={{ color: "var(--muted)" }}>Base block</label>
            <Input value={base} onChange={(e) => setBase(e.target.value)} />
          </div>
          <div>
            <label className="nd-head text-xs block mb-1" style={{ color: "var(--muted)" }}>Requirements (name = hosts)</label>
            <textarea value={req} onChange={(e) => setReq(e.target.value)} rows={4}
              className="nd-input px-2 py-1 text-sm w-full" style={{ resize: "vertical" }} />
          </div>
          <Btn onClick={runVlsm}><ChevronRight size={13} /> Allocate</Btn>
        </div>
        {vlsm?.error && <p className="text-xs mt-3" style={{ color: "var(--amber)" }}>{vlsm.error}</p>}
        {vlsm?.subnets && (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-xs" style={{ whiteSpace: "nowrap", fontFamily: "var(--mono)" }}>
              <thead>
                <tr style={{ color: "var(--muted)" }} className="nd-head">
                  <th className="text-left py-1 pr-3">Name</th><th className="text-left pr-3">Need</th>
                  <th className="text-left pr-3">Subnet</th><th className="text-left pr-3">Range</th><th className="text-left">Hosts</th>
                </tr>
              </thead>
              <tbody>
                {vlsm.subnets.map((s, i) => (
                  <tr key={i} style={{ borderTop: "1px solid var(--border)", color: "var(--text)" }}>
                    <td className="py-1 pr-3">{s.name}</td>
                    <td className="pr-3" style={{ color: "var(--muted)" }}>{s.hosts}</td>
                    {s.error ? (
                      <td colSpan={3} style={{ color: "var(--amber)" }}>{s.error}</td>
                    ) : (
                      <>
                        <td className="pr-3" style={{ color: "var(--green)" }}>{s.network}/{s.prefix}</td>
                        <td className="pr-3">{s.first} – {s.last}</td>
                        <td>{s.usable}</td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  IOS / protocol reference                                           */
/* ------------------------------------------------------------------ */
function ReferenceTool() {
  const [view, setView] = useState("commands");
  const [q, setQ] = useState("");
  const ql = q.toLowerCase();
  const cmds = COMMANDS.filter((c) => (c.cmd + c.desc + c.cat).toLowerCase().includes(ql));
  const ports = PORTS.filter((p) => p.join(" ").toLowerCase().includes(ql));

  const seg = [["commands", "Commands"], ["ports", "Ports"], ["protocols", "Protocols"]];
  return (
    <Panel title="IOS & Protocol Reference" icon={Terminal}>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {seg.map(([id, lbl]) => (
          <button key={id} onClick={() => setView(id)} className="nd-tab px-3 py-1 text-xs nd-head"
            data-active={view === id}>{lbl}</button>
        ))}
        {view !== "protocols" && (
          <div className="flex items-center gap-2 nd-input px-2 py-1 flex-1" style={{ minWidth: "140px" }}>
            <Search size={13} style={{ color: "var(--muted)" }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="filter…"
              className="bg-transparent text-sm w-full" style={{ outline: "none", color: "var(--text)" }} />
          </div>
        )}
      </div>

      {view === "commands" && (
        <div className="grid grid-cols-1 gap-1">
          {cmds.map((c, i) => (
            <div key={i} className="flex items-start gap-3 py-1.5" style={{ borderBottom: "1px solid var(--border)" }}>
              <span className="nd-tag" style={{ minWidth: "62px" }}>{c.cat}</span>
              <div className="min-w-0 flex-1">
                <code className="text-sm" style={{ color: "var(--green)", wordBreak: "break-word" }}>{c.cmd}</code>
                <div className="text-xs" style={{ color: "var(--muted)" }}>{c.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === "ports" && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {ports.map((p, i) => (
            <div key={i} className="nd-panel p-2" style={{ background: "var(--bg2)" }}>
              <div className="text-sm" style={{ color: "var(--green)", fontFamily: "var(--mono)" }}>{p[0]} <span className="text-xs" style={{ color: "var(--muted)" }}>{p[1]}</span></div>
              <div className="text-xs nd-head" style={{ color: "var(--text)" }}>{p[2]}</div>
            </div>
          ))}
        </div>
      )}

      {view === "protocols" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {PROTOCOLS.map((p) => (
            <div key={p.name} className="nd-panel p-3" style={{ background: "var(--bg2)" }}>
              <div className="flex items-center justify-between mb-2">
                <span className="nd-head text-base" style={{ color: "var(--green)" }}>{p.name}</span>
                <span className="nd-tag">AD {p.ad}</span>
              </div>
              <KV k="Type" v={p.type} />
              <KV k="Metric" v={p.metric} />
              <div className="mt-2">
                <span className="nd-head text-xs" style={{ color: "var(--muted)" }}>States</span>
                <div className="text-xs mt-1" style={{ color: "var(--text)" }}>{p.states}</div>
              </div>
              <div className="mt-2">
                <span className="nd-head text-xs" style={{ color: "var(--amber)" }}>Why it fails</span>
                <div className="text-xs mt-1" style={{ color: "var(--muted)" }}>{p.fails}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/*  Inventory + journal                                                */
/* ------------------------------------------------------------------ */
function InventoryTool({ inventory, setInventory, journal, setJournal }) {
  const cols = [
    ["name", "Name"], ["model", "Model"], ["ios", "IOS"], ["mgmt", "Mgmt IP"],
    ["access", "Access"], ["licence", "Licence"], ["notes", "Notes"],
  ];
  const upd = (i, f, v) => setInventory(inventory.map((d, idx) => (idx === i ? { ...d, [f]: v } : d)));
  const addDev = () => setInventory([...inventory, { name: "", model: "", ios: "", mgmt: "", access: "", licence: "", notes: "" }]);
  const delDev = (i) => setInventory(inventory.filter((_, idx) => idx !== i));

  const [jd, setJd] = useState({ device: "General", change: "", outcome: "" });
  const addJournal = () => {
    if (!jd.change.trim()) return;
    const ts = new Date().toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
    setJournal([{ ts, ...jd }, ...journal]);
    setJd({ device: jd.device, change: "", outcome: "" });
  };
  const delJournal = (i) => setJournal(journal.filter((_, idx) => idx !== i));

  return (
    <div className="grid grid-cols-1 gap-4">
      <Panel title="Homelab Inventory" icon={Server}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ whiteSpace: "nowrap" }}>
            <thead>
              <tr className="nd-head" style={{ color: "var(--muted)" }}>
                {cols.map(([, l]) => <th key={l} className="text-left py-1 pr-2">{l}</th>)}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((d, i) => (
                <tr key={i} style={{ borderTop: "1px solid var(--border)" }}>
                  {cols.map(([f]) => (
                    <td key={f} className="pr-2 py-1">
                      <input value={d[f]} onChange={(e) => upd(i, f, e.target.value)}
                        className="nd-input px-1.5 py-1 text-xs" style={{ minWidth: f === "notes" ? "150px" : "92px" }} />
                    </td>
                  ))}
                  <td><button onClick={() => delDev(i)} title="remove" style={{ color: "var(--red)" }}><Trash2 size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3"><Btn onClick={addDev}><Plus size={13} /> Add device</Btn></div>
        <p className="text-xs mt-2" style={{ color: "var(--muted2)" }}>Mock-up holds this in memory — the standalone build persists it between sessions.</p>
      </Panel>

      <Panel title="Lab Journal" icon={Activity} delay={80}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 mb-3">
          <select value={jd.device} onChange={(e) => setJd({ ...jd, device: e.target.value })} className="nd-input px-2 py-1 text-sm">
            <option>General</option>
            {inventory.map((d, i) => <option key={i}>{d.name || `Device ${i + 1}`}</option>)}
          </select>
          <Input value={jd.change} onChange={(e) => setJd({ ...jd, change: e.target.value })} placeholder="What changed…" className="md:col-span-1" />
          <Input value={jd.outcome} onChange={(e) => setJd({ ...jd, outcome: e.target.value })} placeholder="Outcome…" />
          <Btn onClick={addJournal}><Plus size={13} /> Log entry</Btn>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {journal.map((e, i) => (
            <div key={i} className="nd-panel p-2 flex items-start gap-3" style={{ background: "var(--bg2)" }}>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="nd-tag">{e.device}</span>
                  <span className="text-xs" style={{ color: "var(--muted)" }}>{e.ts}</span>
                </div>
                <div className="text-sm mt-1" style={{ color: "var(--text)" }}>{e.change}</div>
                {e.outcome && <div className="text-xs mt-0.5" style={{ color: "var(--green)" }}>→ {e.outcome}</div>}
              </div>
              <button onClick={() => delJournal(i)} style={{ color: "var(--red)" }}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Config generator                                                   */
/* ------------------------------------------------------------------ */
function ConfigTool() {
  const [tpl, setTpl] = useState("base");
  const [c, setC] = useState({
    hostname: "LAB-RTR1", domain: "homelab.local", enablesecret: "Str0ngEnable!",
    mgmtIf: "GigabitEthernet0/0", mgmtIp: "192.168.10.1", mgmtMask: "255.255.255.0",
    gateway: "192.168.10.254", sshUser: "ben", sshPass: "Str0ngSSH!",
    vlanId: "10", vlanName: "USERS", sviIp: "10.10.10.1", sviMask: "255.255.255.0", trunkIf: "GigabitEthernet0/1",
    ospfPid: "1", routerId: "1.1.1.1", ospfNet: "192.168.10.0", ospfWild: "0.0.0.255", ospfArea: "0",
    peerIp: "203.0.113.2", psk: "FlexVPNkey123", tunIp: "172.16.0.1", tunMask: "255.255.255.252", tunSrc: "GigabitEthernet0/0",
  });
  const set = (f, v) => setC({ ...c, [f]: v });
  const [copied, setCopied] = useState(false);

  const fieldsFor = {
    base: [["hostname", "Hostname"], ["domain", "Domain name"], ["enablesecret", "Enable secret"], ["mgmtIf", "Mgmt interface"], ["mgmtIp", "Mgmt IP"], ["mgmtMask", "Mgmt mask"], ["gateway", "Default gateway"], ["sshUser", "SSH username"], ["sshPass", "SSH password"]],
    vlan: [["vlanId", "VLAN ID"], ["vlanName", "VLAN name"], ["sviIp", "SVI IP"], ["sviMask", "SVI mask"], ["trunkIf", "Trunk interface"]],
    ospf: [["ospfPid", "Process ID"], ["routerId", "Router-ID"], ["ospfNet", "Network"], ["ospfWild", "Wildcard"], ["ospfArea", "Area"]],
    flexvpn: [["peerIp", "Peer IP"], ["psk", "Pre-shared key"], ["tunIp", "Tunnel IP"], ["tunMask", "Tunnel mask"], ["tunSrc", "Tunnel source"]],
  }[tpl];

  const gen = () => {
    if (tpl === "base") return `hostname ${c.hostname}
!
ip domain name ${c.domain}
enable secret ${c.enablesecret}
username ${c.sshUser} privilege 15 secret ${c.sshPass}
!
! generate keys (exec or config): crypto key generate rsa modulus 2048
ip ssh version 2
!
interface ${c.mgmtIf}
 ip address ${c.mgmtIp} ${c.mgmtMask}
 no shutdown
!
ip route 0.0.0.0 0.0.0.0 ${c.gateway}
!
line vty 0 4
 login local
 transport input ssh
!
end`;
    if (tpl === "vlan") return `vlan ${c.vlanId}
 name ${c.vlanName}
!
interface vlan ${c.vlanId}
 ip address ${c.sviIp} ${c.sviMask}
 no shutdown
!
interface ${c.trunkIf}
 switchport trunk encapsulation dot1q
 switchport mode trunk
 switchport trunk allowed vlan add ${c.vlanId}
!
end`;
    if (tpl === "ospf") return `router ospf ${c.ospfPid}
 router-id ${c.routerId}
 log-adjacency-changes
 network ${c.ospfNet} ${c.ospfWild} area ${c.ospfArea}
 passive-interface default
 no passive-interface ${c.mgmtIf}
!
end`;
    return `! --- IKEv2 / FlexVPN headend skeleton ---
crypto ikev2 proposal PROP-1
 encryption aes-cbc-256
 integrity sha256
 group 14
!
crypto ikev2 policy POL-1
 proposal PROP-1
!
crypto ikev2 keyring KR-1
 peer PEER
  address ${c.peerIp}
  pre-shared-key ${c.psk}
!
crypto ikev2 profile PROF-1
 match identity remote address ${c.peerIp} 255.255.255.255
 authentication local pre-share
 authentication remote pre-share
 keyring local KR-1
!
crypto ipsec transform-set TS-1 esp-aes 256 esp-sha256-hmac
 mode tunnel
!
crypto ipsec profile IPSEC-1
 set transform-set TS-1
 set ikev2-profile PROF-1
!
interface Tunnel0
 ip address ${c.tunIp} ${c.tunMask}
 tunnel source ${c.tunSrc}
 tunnel mode ipsec ipv4
 tunnel destination ${c.peerIp}
 tunnel protection ipsec profile IPSEC-1
!
end`;
  };

  const output = gen();
  const copy = async () => {
    try { await navigator.clipboard.writeText(output); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch (_) {}
  };

  const tabs = [["base", "Base device"], ["vlan", "VLAN / SVI"], ["ospf", "OSPF"], ["flexvpn", "IKEv2 / FlexVPN"]];
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Panel title="Template Parameters" icon={FileCode2}>
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          {tabs.map(([id, l]) => (
            <button key={id} onClick={() => setTpl(id)} className="nd-tab px-3 py-1 text-xs nd-head" data-active={tpl === id}>{l}</button>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {fieldsFor.map(([f, l]) => (
            <div key={f}>
              <label className="nd-head text-xs block mb-1" style={{ color: "var(--muted)" }}>{l}</label>
              <Input value={c[f]} onChange={(e) => set(f, e.target.value)} />
            </div>
          ))}
        </div>
      </Panel>
      <Panel title="Generated CLI" icon={Terminal} delay={80}>
        <div className="flex justify-end mb-2">
          <Btn onClick={copy} kind="ghost">{copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}</Btn>
        </div>
        <pre className="nd-code text-xs p-3 overflow-x-auto" style={{ color: "var(--text)" }}>{output}</pre>
      </Panel>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Gauge + speed test                                                 */
/* ------------------------------------------------------------------ */
function Gauge({ value, max, color }) {
  const cx = 110, cy = 110, r = 88;
  const v = Math.max(0, Math.min(value || 0, max));
  const angle = 180 - (v / max) * 180;
  const polar = (a) => { const rad = (a * Math.PI) / 180; return [cx + r * Math.cos(rad), cy - r * Math.sin(rad)]; };
  const arc = (a0, a1) => { const [x0, y0] = polar(a0); const [x1, y1] = polar(a1); return `M ${x0} ${y0} A ${r} ${r} 0 0 0 ${x1} ${y1}`; };
  const [nx, ny] = polar(angle);
  return (
    <svg viewBox="0 0 220 132" style={{ width: "100%", maxWidth: "300px" }}>
      <path d={arc(180, 0)} fill="none" stroke="var(--border)" strokeWidth="12" strokeLinecap="round" />
      <path d={arc(180, angle)} fill="none" stroke={color} strokeWidth="12" strokeLinecap="round"
        style={{ transition: "all .15s linear" }} />
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="2.5" style={{ transition: "all .15s linear" }} />
      <circle cx={cx} cy={cy} r="6" fill={color} />
      <text x={cx} y="92" textAnchor="middle" style={{ fill: "var(--text)", fontSize: "30px", fontFamily: "var(--mono)", fontWeight: 700 }}>{(value || 0).toFixed(1)}</text>
      <text x={cx} y="110" textAnchor="middle" style={{ fill: "var(--muted)", fontSize: "11px", fontFamily: "var(--head)", letterSpacing: "2px" }}>Mbps DOWN</text>
    </svg>
  );
}

const CF_DOWN = "https://speed.cloudflare.com/__down?bytes=";
const CF_UP = "https://speed.cloudflare.com/__up";

function SpeedTool({ setLastSpeed }) {
  const [dl, setDl] = useState(0);
  const [ul, setUl] = useState(0);
  const [lat, setLat] = useState(0);
  const [jit, setJit] = useState(0);
  const [status, setStatus] = useState("idle");
  const [phase, setPhase] = useState("");
  const demoRef = useRef(null);

  useEffect(() => () => { if (demoRef.current) clearInterval(demoRef.current); }, []);

  const runDemo = () => {
    setStatus("demo"); setPhase("demo");
    let t = 0;
    const tgt = { dl: 187.4, ul: 51.8, lat: 13.6, jit: 1.9 };
    if (demoRef.current) clearInterval(demoRef.current);
    demoRef.current = setInterval(() => {
      t += 1;
      const k = Math.min(1, t / 22);
      const ease = 1 - Math.pow(1 - k, 3);
      setLat(tgt.lat); setJit(tgt.jit);
      setDl(tgt.dl * ease + (Math.random() - 0.5) * 6 * (1 - ease));
      setUl(tgt.ul * ease);
      if (k >= 1) { clearInterval(demoRef.current); setDl(tgt.dl); setUl(tgt.ul); setLastSpeed({ dl: tgt.dl, lat: tgt.lat }); }
    }, 55);
  };

  const run = async () => {
    setStatus("running"); setDl(0); setUl(0); setLat(0); setJit(0);
    try {
      setPhase("latency");
      const samples = [];
      for (let i = 0; i < 6; i++) {
        const t0 = performance.now();
        const res = await fetch(CF_DOWN + "0&r=" + Math.random(), { cache: "no-store" });
        await res.arrayBuffer();
        samples.push(performance.now() - t0);
      }
      samples.sort((a, b) => a - b);
      const mn = samples[0];
      const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
      const jitter = Math.sqrt(samples.reduce((a, b) => a + (b - mean) ** 2, 0) / samples.length);
      setLat(mn); setJit(jitter);

      setPhase("download");
      const bytes = 25_000_000;
      const start = performance.now();
      const res = await fetch(CF_DOWN + bytes + "&r=" + Math.random(), { cache: "no-store" });
      let final;
      if (res.body && res.body.getReader) {
        const reader = res.body.getReader();
        let recv = 0;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          recv += value.length;
          setDl((recv * 8) / (((performance.now() - start) / 1000) * 1e6));
        }
        final = (bytes * 8) / (((performance.now() - start) / 1000) * 1e6);
      } else {
        await res.arrayBuffer();
        final = (bytes * 8) / (((performance.now() - start) / 1000) * 1e6);
      }
      setDl(final);

      setPhase("upload");
      const up = 8_000_000;
      const payload = new Uint8Array(up);
      const us = performance.now();
      await fetch(CF_UP, { method: "POST", body: payload, cache: "no-store" });
      const upMbps = (up * 8) / (((performance.now() - us) / 1000) * 1e6);
      setUl(upMbps);

      setStatus("done"); setPhase("");
      setLastSpeed({ dl: final, lat: mn });
    } catch (e) {
      runDemo();
    }
  };

  const tile = (label, value, unit, ok) => (
    <div className="nd-panel p-3 text-center" style={{ background: "var(--bg2)" }}>
      <div className="text-2xl" style={{ color: ok ? "var(--green)" : "var(--text)", fontFamily: "var(--mono)" }}>{value}</div>
      <div className="nd-head text-xs mt-1" style={{ color: "var(--muted)" }}>{label} <span style={{ color: "var(--muted2)" }}>{unit}</span></div>
    </div>
  );

  return (
    <Panel title="Internet Speed Test" icon={GaugeIcon}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        <div className="flex flex-col items-center">
          <Gauge value={dl} max={250} color="var(--green)" />
          <div className="mt-2">
            {status === "running"
              ? <span className="nd-head text-xs" style={{ color: "var(--amber)" }}>● Testing {phase}…</span>
              : status === "demo"
                ? <span className="nd-head text-xs" style={{ color: "var(--amber)" }}>● DEMO — sandbox blocked the live test</span>
                : <Btn onClick={run}><Play size={13} /> Run test</Btn>}
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {tile("Download", dl.toFixed(1), "Mbps", true)}
          {tile("Upload", ul.toFixed(1), "Mbps")}
          {tile("Latency", lat.toFixed(0), "ms")}
          {tile("Jitter", jit.toFixed(1), "ms")}
          {tile("Ping host", "speed.cf", "")}
          {tile("Status", status === "done" ? "OK" : status === "demo" ? "DEMO" : status === "running" ? "···" : "—", "")}
        </div>
      </div>
      <p className="text-xs mt-3" style={{ color: "var(--muted2)" }}>
        Measures browser-to-Cloudflare throughput (approximates line speed). If this sandbox blocks the request it auto-switches to a labelled demo — the real test runs in the standalone build. True ICMP ping / traceroute needs the phase-2 local backend.
      </p>
    </Panel>
  );
}

/* ------------------------------------------------------------------ */
/*  Overview                                                           */
/* ------------------------------------------------------------------ */
function Overview({ inventory, journal, lastSpeed, go }) {
  const [val, setVal] = useState("10.0.0.0/24");
  const p = parseCidr(val);
  const r = p ? calcSubnet(p.ip, p.cidr) : null;
  const stat = (label, value, icon) => (
    <div className="nd-panel p-3" style={{ background: "var(--bg2)" }}>
      <div className="flex items-center gap-2 mb-1">{icon}<span className="nd-head text-xs" style={{ color: "var(--muted)" }}>{label}</span></div>
      <div className="text-2xl" style={{ color: "var(--green)", fontFamily: "var(--mono)" }}>{value}</div>
    </div>
  );
  const shortcuts = [["subnet", "Subnet / VLSM", Calculator], ["ref", "IOS Reference", Terminal], ["inv", "Inventory", Server], ["cfg", "Config Gen", FileCode2], ["speed", "Speed Test", GaugeIcon]];
  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 nd-fade">
        {stat("Devices", inventory.length, <Cpu size={14} style={{ color: "var(--green)" }} />)}
        {stat("Journal entries", journal.length, <Activity size={14} style={{ color: "var(--green)" }} />)}
        {stat("Last download", lastSpeed ? `${lastSpeed.dl.toFixed(0)}` : "—", <GaugeIcon size={14} style={{ color: "var(--green)" }} />)}
        {stat("Last latency", lastSpeed ? `${lastSpeed.lat.toFixed(0)}ms` : "—", <ShieldCheck size={14} style={{ color: "var(--green)" }} />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="Quick Lookup" icon={Calculator} delay={60}>
          <Input value={val} onChange={(e) => setVal(e.target.value)} placeholder="IP/CIDR" />
          {r ? (
            <div className="mt-3">
              <KV k="Network" v={`${r.network}/${r.cidr}`} accent />
              <KV k="Usable hosts" v={r.usable.toLocaleString()} />
              <KV k="Wildcard" v={r.wildcard} accent />
              <KV k="Range" v={`${r.first} – ${r.last}`} />
            </div>
          ) : <p className="text-xs mt-3" style={{ color: "var(--amber)" }}>Enter a valid address</p>}
        </Panel>
        <Panel title="Modules" icon={Network} delay={120}>
          <div className="grid grid-cols-1 gap-2">
            {shortcuts.map(([id, l, Icon]) => (
              <button key={id} onClick={() => go(id)} className="nd-row flex items-center justify-between px-3 py-2">
                <span className="flex items-center gap-2 nd-head text-sm" style={{ color: "var(--text)" }}><Icon size={15} style={{ color: "var(--green)" }} /> {l}</span>
                <ChevronRight size={15} style={{ color: "var(--muted)" }} />
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */
const STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500;600&display=swap');
:root{
  --bg:#eceff3; --bg2:#f4f6f9; --panel:#ffffff;
  --border:#e2e7ed; --green:#3f5b7a; --amber:#946517; --red:#bb4a46;
  --text:#262d38; --muted:#69737f; --muted2:#9aa4b0; --accent-soft:#eef2f7;
  --mono:'Spline Sans Mono',ui-monospace,monospace; --head:'Hanken Grotesk',-apple-system,system-ui,sans-serif;
}
*{ box-sizing:border-box; }
.nd-root{ background:var(--bg); color:var(--text); font-family:var(--head); min-height:100%; -webkit-font-smoothing:antialiased;
  background-image:
    radial-gradient(1100px 520px at 50% -10%, rgba(255,255,255,.75), transparent 60%),
    radial-gradient(circle, rgba(38,55,82,.05) 1px, transparent 1.4px);
  background-size: auto, 24px 24px;
}
.nd-head{ font-family:var(--head); font-weight:600; letter-spacing:-0.01em; }
code,pre,kbd{ font-family:var(--mono); }
.nd-panel{ background:var(--panel); border:1px solid var(--border); border-radius:11px; box-shadow:0 1px 2px rgba(20,28,40,.04), 0 6px 18px rgba(20,28,40,.04); }
.nd-input{ background:var(--bg2); border:1px solid var(--border); border-radius:7px; color:var(--text); font-family:var(--mono); }
.nd-input::placeholder{ color:var(--muted2); }
.nd-input:focus{ outline:none; border-color:var(--green); box-shadow:0 0 0 3px rgba(63,91,122,.13); background:#fff; }
select.nd-input{ -webkit-appearance:none; appearance:none; }
.nd-btn{ background:var(--green); border:1px solid var(--green); border-radius:7px; color:#fff; font-weight:600; letter-spacing:0; cursor:pointer; transition:all .15s; box-shadow:0 1px 2px rgba(20,28,40,.10); }
.nd-btn:hover{ background:#34506e; border-color:#34506e; }
.nd-btn-ghost{ background:#fff; border:1px solid var(--border); border-radius:7px; color:var(--muted); font-weight:600; cursor:pointer; transition:all .15s; }
.nd-btn-ghost:hover{ color:var(--text); border-color:#c8d1dc; background:var(--bg2); }
.nd-tab{ background:transparent; border:1px solid transparent; border-radius:7px; color:var(--muted); font-weight:600; letter-spacing:0; cursor:pointer; transition:all .15s; }
.nd-tab:hover{ color:var(--text); background:var(--accent-soft); }
.nd-tab[data-active="true"]{ color:var(--green); border-color:var(--border); background:#fff; box-shadow:0 1px 2px rgba(20,28,40,.05); }
.nd-tag{ font-family:var(--head); font-size:10.5px; font-weight:600; letter-spacing:0; color:var(--green); background:var(--accent-soft); border:1px solid var(--border); border-radius:5px; padding:1px 7px; display:inline-block; }
.nd-code{ background:var(--bg2); border:1px solid var(--border); border-radius:8px; font-family:var(--mono); line-height:1.5; }
.nd-row{ background:var(--bg2); border:1px solid var(--border); border-radius:8px; cursor:pointer; transition:all .15s; width:100%; }
.nd-row:hover{ border-color:#c8d1dc; background:#fff; box-shadow:0 1px 3px rgba(20,28,40,.06); }
.nd-dot{ width:7px; height:7px; border-radius:50%; background:#2e9e6b; box-shadow:0 0 0 3px rgba(46,158,107,.16); animation:ndPulse 2s infinite; }
@keyframes ndPulse{ 0%,100%{opacity:1} 50%{opacity:.45} }
@keyframes ndFade{ from{opacity:0; transform:translateY(8px)} to{opacity:1; transform:none} }
.nd-fade{ animation:ndFade .45s cubic-bezier(.2,.7,.2,1) both; }
::-webkit-scrollbar{ height:9px; width:9px; }
::-webkit-scrollbar-track{ background:transparent; }
::-webkit-scrollbar-thumb{ background:#ccd5df; border-radius:5px; border:2px solid var(--bg); }
::-webkit-scrollbar-thumb:hover{ background:#b4bec9; }
input,textarea{ font-family:var(--mono); }
`;

/* ------------------------------------------------------------------ */
/*  App shell                                                          */
/* ------------------------------------------------------------------ */
export default function NetOpsConsole() {
  const [tab, setTab] = useState("overview");
  const [clock, setClock] = useState("");
  const [lastSpeed, setLastSpeed] = useState(null);
  const [inventory, setInventory] = useState([
    { name: "C1117-4P", model: "Cisco C1117-4P", ios: "IOS XE 16.x (_ias)", mgmt: "192.168.10.1", access: "Console / SSH", licence: "securityk9 (verifying)", notes: "license boot level securityk9 set" },
    { name: "ISR 921", model: "Cisco C921-4P", ios: "IOS 15.8(3)M6", mgmt: "192.168.10.2", access: "Console / SSH", licence: "securityk9 EvalRTU (c900)", notes: "IKEv2 / FlexVPN headend" },
    { name: "Cat2960-A", model: "Catalyst WS-C2960", ios: "IOS 15.0(2)SE", mgmt: "192.168.10.11", access: "Console", licence: "LAN Base", notes: "Access switch — lab core" },
    { name: "Cat2960-B", model: "Catalyst WS-C2960", ios: "IOS 15.0(2)SE", mgmt: "192.168.10.12", access: "Console", licence: "LAN Base", notes: "Spare / recovery practice" },
  ]);
  const [journal, setJournal] = useState([
    { ts: "02/06/2026 09:14", device: "ISR 921", change: "Recovered from AAA lockout via early Boot Break, rebuilt aaa config", outcome: "Mgmt access restored, SSH back up" },
    { ts: "01/06/2026 20:30", device: "C1117-4P", change: "Set license boot level securityk9 and reloaded", outcome: "Verifying securityk9 features post-reload" },
  ]);

  useEffect(() => {
    const t = setInterval(() => setClock(new Date().toLocaleTimeString("en-GB")), 1000);
    setClock(new Date().toLocaleTimeString("en-GB"));
    return () => clearInterval(t);
  }, []);

  const TABS = [
    ["overview", "Overview", Activity], ["subnet", "Subnet / VLSM", Calculator],
    ["ref", "IOS Reference", Terminal], ["inv", "Inventory", Server],
    ["cfg", "Config Gen", FileCode2], ["speed", "Speed Test", GaugeIcon],
  ];

  return (
    <div className="nd-root">
      <style>{STYLE}</style>
      <div style={{ maxWidth: "1180px", margin: "0 auto", padding: "16px" }}>
        <header className="nd-panel nd-fade p-3 mb-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <Network size={22} style={{ color: "var(--green)" }} />
            <div>
              <div className="nd-head text-base" style={{ color: "var(--text)", letterSpacing: "-0.02em", fontWeight: 700 }}>
                NETOPS<span style={{ color: "var(--green)" }}>·CONSOLE</span>
              </div>
              <div className="text-xs" style={{ color: "var(--muted)" }}>network engineer daily driver — mock-up</div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm" style={{ color: "var(--green)", fontFamily: "var(--mono)" }}>{clock}</div>
            <div className="flex items-center gap-2"><span className="nd-dot" /><span className="nd-head text-xs" style={{ color: "var(--muted)" }}>ONLINE</span></div>
          </div>
        </header>

        <nav className="flex items-center gap-2 mb-4 overflow-x-auto" style={{ paddingBottom: "4px" }}>
          {TABS.map(([id, l, Icon]) => (
            <button key={id} onClick={() => setTab(id)} className="nd-tab px-3 py-2 text-xs nd-head flex items-center gap-2"
              data-active={tab === id} style={{ whiteSpace: "nowrap" }}>
              <Icon size={14} /> {l}
            </button>
          ))}
        </nav>

        <main key={tab}>
          {tab === "overview" && <Overview inventory={inventory} journal={journal} lastSpeed={lastSpeed} go={setTab} />}
          {tab === "subnet" && <SubnetTool />}
          {tab === "ref" && <ReferenceTool />}
          {tab === "inv" && <InventoryTool inventory={inventory} setInventory={setInventory} journal={journal} setJournal={setJournal} />}
          {tab === "cfg" && <ConfigTool />}
          {tab === "speed" && <SpeedTool setLastSpeed={setLastSpeed} />}
        </main>

        <footer className="mt-6 text-center text-xs" style={{ color: "var(--muted2)" }}>
          Mock-up · in-memory data · calculators &amp; config generator fully functional
        </footer>
      </div>
    </div>
  );
}
