(() => {
  // NVCPD Demo data (Nowhere Ville, USA)
  const STATIONS = [
    {
      id: "hq",
      name: "NVCPD Headquarters",
      area: "Downtown Nowhere Ville",
      postcode: "00001",
      addressLines: ["100 Justice Avenue", "Nowhere Ville, USA"],
      phone: "+15550101",
      email: "hq@nvcpd.gov",
      lat: 37.7749,
      lon: -122.4194,
      hours: [
        ["Mon–Fri", "08:00 AM – 06:00 PM"],
        ["Sat", "10:00 AM – 04:00 PM"],
        ["Sun", "Closed"],
      ],
    },
    {
      id: "north",
      name: "North Precinct",
      area: "North Nowhere Ville",
      postcode: "00012",
      addressLines: ["2400 North Parkway", "Nowhere Ville, USA"],
      phone: "+15550121",
      email: "north@nvcpd.gov",
      lat: 37.8044,
      lon: -122.2712,
      hours: [
        ["Mon–Fri", "09:00 AM – 07:00 PM"],
        ["Sat", "10:00 AM – 02:00 PM"],
        ["Sun", "Closed"],
      ],
    },
    {
      id: "south",
      name: "South Precinct",
      area: "South Nowhere Ville",
      postcode: "00024",
      addressLines: ["8800 South Service Rd", "Nowhere Ville, USA"],
      phone: "+15550134",
      email: "south@nvcpd.gov",
      lat: 37.6879,
      lon: -122.4702,
      hours: [
        ["Mon–Fri", "08:30 AM – 05:30 PM"],
        ["Sat–Sun", "Closed"],
      ],
    },
  ];

  // Utilities
  const $ = (sel) => document.querySelector(sel);
  const qs = new URLSearchParams(location.search);

  const escapeHtml = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const setYear = () => {
    const y = $("#year");
    if (y) y.textContent = new Date().getFullYear();
  };

  const telHref = (phone) => `tel:${String(phone).replace(/[^\d+]/g, "")}`;

  const osmEmbedUrl = (lat, lon) => {
    const d = 0.01;
    const left = lon - d;
    const right = lon + d;
    const bottom = lat - d;
    const top = lat + d;
    const bbox = `${left}%2C${bottom}%2C${right}%2C${top}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
  };

  const osmDirectionsUrl = (lat, lon) =>
    `https://www.openstreetmap.org/directions?to=${lat}%2C${lon}`;

  // Mobile menu
  function setupMobileMenu() {
    const btn = $("#menuBtn");
    const nav = $("#mobileNav");
    if (!btn || !nav) return;

    btn.addEventListener("click", () => {
      const isOpen = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", String(!isOpen));
      nav.hidden = isOpen;
    });

    // close after click
    nav.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      btn.setAttribute("aria-expanded", "false");
      nav.hidden = true;
    });
  }

  // Site alert
  function setupSiteAlert() {
    const alertEl = $("#siteAlert");
    const dismiss = $("#dismissAlert");
    const toggle = $("#toggleDemoAlert");

    dismiss?.addEventListener("click", () => {
      alertEl?.setAttribute("hidden", "");
    });

    toggle?.addEventListener("click", () => {
      if (!alertEl) return;
      if (alertEl.hasAttribute("hidden")) alertEl.removeAttribute("hidden");
      else alertEl.setAttribute("hidden", "");
    });
  }

  // Flash message (from redirects)
  function setupFlash() {
    const msg = qs.get("msg");
    const flash = $("#flash");
    const stationFlash = $("#stationFlash");
    const target = flash || stationFlash;
    if (!msg || !target) return;

    target.textContent = msg;
    target.hidden = false;
  }

  // Homepage stations list
  function renderStations(list) {
    const grid = $("#stationsGrid");
    const count = $("#stationsCount");
    if (!grid) return;

    grid.innerHTML = list
      .map((s) => {
        const addr = `${s.addressLines.join(", ")} ${s.postcode}`;
        return `
          <article class="card station-card">
            <h3 class="title">
              <a href="./station.html?id=${encodeURIComponent(s.id)}">${escapeHtml(s.name)}</a>
            </h3>
            <p class="addr">${escapeHtml(addr)}</p>
            <div class="row">
              <div class="meta-line">${escapeHtml(s.area)}</div>
              <div class="meta-line">ZIP ${escapeHtml(s.postcode)}</div>
            </div>
            <div class="actions">
              <a class="btn btn-primary btn-sm" href="./station.html?id=${encodeURIComponent(s.id)}">View Details</a>
              <a class="btn btn-ghost btn-sm" href="${telHref(s.phone)}" aria-label="Call ${escapeHtml(s.name)}">Call</a>
            </div>
          </article>
        `;
      })
      .join("");

    if (count) count.textContent = `${list.length} station${list.length === 1 ? "" : "s"} shown.`;
  }

  function setupStationSearch() {
    const input = $("#stationSearch");
    const grid = $("#stationsGrid");
    if (!input || !grid) return;

    const all = [...STATIONS];
    renderStations(all);

    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      if (!q) return renderStations(all);

      const filtered = all.filter((s) => {
        const hay = `${s.name} ${s.area} ${s.postcode} ${s.addressLines.join(" ")}`.toLowerCase();
        return hay.includes(q);
      });

      renderStations(filtered);
    });
  }

  // Form (demo submit)
  function setupReportForm() {
    const form = $("#reportForm");
    const status = $("#formStatus");
    if (!form || !status) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const details = form.elements["details"];
      const date = form.elements["date"];
      const consent = form.elements["consent"];

      const errors = [];
      if (!details?.value || details.value.trim().length < 20) errors.push("Please describe the incident (minimum 20 characters).");
      if (!date?.value) errors.push("Please select the incident date.");
      if (!consent?.checked) errors.push("Please confirm this is not an emergency.");

      if (errors.length) {
        status.textContent = errors[0];
        status.style.color = "#b42318";
        return;
      }

      status.textContent = "Submitted (demo). In production, this would securely send to NVCPD.";
      status.style.color = "#0b2f6b";
      form.reset();
    });
  }

  // Station page renderer + redirect
  function renderStationPage() {
    const nameEl = $("#stationName");
    if (!nameEl) return; // not on station page

    const id = qs.get("id");
    const station = STATIONS.find((s) => s.id === id);

    if (!id || !station) {
      const msg = encodeURIComponent("Station not found. Showing station list.");
      location.replace(`./index.html?msg=${msg}#stations`);
      return;
    }

    document.title = `NVCPD | ${station.name}`;

    $("#stationName").textContent = station.name;
    $("#stationMeta").textContent = `${station.area} · Nowhere Ville, USA ${station.postcode}`;

    $("#stationAddress").innerHTML = `
      <strong>${escapeHtml(station.name)}</strong><br />
      ${escapeHtml(station.addressLines[0])}<br />
      ${escapeHtml(station.addressLines[1])}<br />
      <strong>ZIP:</strong> ${escapeHtml(station.postcode)}
    `;

    const phone = $("#stationPhone");
    if (phone) {
      phone.textContent = station.phone;
      phone.href = telHref(station.phone);
    }

    const email = $("#stationEmail");
    if (email) {
      email.textContent = station.email;
      email.href = `mailto:${station.email}`;
    }

    const callBtn = $("#callBtn");
    if (callBtn) callBtn.href = telHref(station.phone);

    const dirBtn = $("#directionsBtn");
    if (dirBtn) dirBtn.href = osmDirectionsUrl(station.lat, station.lon);

    const hours = $("#hoursList");
    if (hours) {
      hours.innerHTML = station.hours
        .map(([d, h]) => `<li><strong>${escapeHtml(d)}:</strong> ${escapeHtml(h)}</li>`)
        .join("");
    }

    const map = $("#mapFrame");
    if (map) map.src = osmEmbedUrl(station.lat, station.lon);
  }

  function init() {
    setYear();
    setupMobileMenu();
    setupSiteAlert();
    setupFlash();
    setupStationSearch();
    setupReportForm();
    renderStationPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
