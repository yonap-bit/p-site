(() => {
  const STATIONS = [
    {
      id: "central",
      name: "Central Station",
      area: "Westminster",
      postcode: "SW1A 1AA",
      addressLines: ["12 Example Road", "London"],
      phone: "+442012345678",
      email: "central@example.police.uk",
      lat: 51.5079,
      lon: -0.1281,
      hours: [
        ["Mon–Fri", "08:00–20:00"],
        ["Sat", "10:00–18:00"],
        ["Sun", "10:00–16:00"],
      ],
    },
    {
      id: "northside",
      name: "Northside Station",
      area: "Camden",
      postcode: "NW1 4NP",
      addressLines: ["55 Borough Street", "London"],
      phone: "+442076543210",
      email: "northside@example.police.uk",
      lat: 51.5413,
      lon: -0.1420,
      hours: [
        ["Mon–Fri", "09:00–19:00"],
        ["Sat", "10:00–16:00"],
        ["Sun", "Closed"],
      ],
    },
    {
      id: "riverside",
      name: "Riverside Station",
      area: "Southwark",
      postcode: "SE1 9GF",
      addressLines: ["8 River Walk", "London"],
      phone: "+442079998888",
      email: "riverside@example.police.uk",
      lat: 51.5048,
      lon: -0.0890,
      hours: [
        ["Mon–Fri", "08:00–18:00"],
        ["Sat–Sun", "10:00–14:00"],
      ],
    },
  ];

  // --- utilities
  const $ = (sel) => document.querySelector(sel);
  const setYear = () => {
    const y = $("#year");
    if (y) y.textContent = new Date().getFullYear();
  };

  const escapeHtml = (s) =>
    String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");

  const qs = new URLSearchParams(location.search);
  const getFlashFromUrl = () => qs.get("msg");
  const showFlash = (message) => {
    const el = $("#flash");
    if (!el || !message) return;
    el.textContent = message;
    el.classList.remove("hidden");
  };

  const formatPhoneHref = (phone) => {
    const cleaned = phone.replace(/[^\d+]/g, "");
    return `tel:${cleaned}`;
  };

  const osmEmbedUrl = (lat, lon) => {
    const delta = 0.01;
    const left = lon - delta;
    const right = lon + delta;
    const bottom = lat - delta;
    const top = lat + delta;
    const bbox = `${left}%2C${bottom}%2C${right}%2C${top}`;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lon}`;
  };

  const osmDirectionsUrl = (lat, lon) =>
    `https://www.openstreetmap.org/directions?to=${lat}%2C${lon}`;

  // --- homepage
  function renderStationsGrid(list) {
    const grid = $("#stationsGrid");
    const count = $("#stationsCount");
    if (!grid) return;

    grid.innerHTML = list
      .map((s) => {
        const addr = `${s.addressLines.join(", ")}, ${s.postcode}`;
        return `
          <article class="card station-card">
            <h3>
              <a href="./station.html?id=${encodeURIComponent(s.id)}">
                ${escapeHtml(s.name)}
              </a>
            </h3>
            <p class="muted">${escapeHtml(addr)}</p>
            <div class="meta">
              <span>Area: ${escapeHtml(s.area)}</span>
              <span>Postcode: ${escapeHtml(s.postcode)}</span>
            </div>
            <div class="cta" style="margin-top:12px">
              <a class="btn light" href="./station.html?id=${encodeURIComponent(s.id)}">View details</a>
              <a class="btn" href="${formatPhoneHref(s.phone)}" aria-label="Call ${escapeHtml(s.name)}">${escapeHtml(s.phone)}</a>
            </div>
          </article>
        `;
      })
      .join("");

    if (count) count.textContent = `${list.length} station${list.length === 1 ? "" : "s"} shown.`;
  }

  function setupStationSearch() {
    const input = $("#stationSearch");
    if (!input) return;

    const all = [...STATIONS];
    renderStationsGrid(all);

    input.addEventListener("input", () => {
      const q = input.value.trim().toLowerCase();
      if (!q) return renderStationsGrid(all);

      const filtered = all.filter((s) => {
        const hay = `${s.name} ${s.area} ${s.postcode} ${s.addressLines.join(" ")}`.toLowerCase();
        return hay.includes(q);
      });
      renderStationsGrid(filtered);
    });
  }

  function setupReportForm() {
    const form = $("#reportForm");
    const status = $("#formStatus");
    if (!form || !status) return;

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const details = form.elements["details"];
      const date = form.elements["date"];
      const consent = form.elements["consent"];

      const problems = [];
      if (!details.value || details.value.trim().length < 20) problems.push("Please describe what happened (min 20 characters).");
      if (!date.value) problems.push("Please select a date of incident.");
      if (!consent.checked) problems.push("Please confirm this is not an emergency.");

      if (problems.length) {
        status.textContent = problems[0];
        status.style.color = "#fecaca";
        return;
      }

      status.textContent = "Submitted (demo). In a real site, this would send to a secure endpoint.";
      status.style.color = "#bbf7d0";
      form.reset();
    });
  }

  function setupAlertDemo() {
    const toggleBtn = $("#toggleAlertBtn");
    const alertEl = $("#globalAlert");
    const dismissBtn = $("#dismissAlertBtn");
    if (!alertEl) return;

    toggleBtn?.addEventListener("click", () => {
      alertEl.classList.toggle("hidden");
    });

    dismissBtn?.addEventListener("click", () => {
      alertEl.classList.add("hidden");
    });
  }

  // --- station page
  function renderStationPage() {
    const nameEl = $("#stationName");
    if (!nameEl) return; // not on station page

    const id = qs.get("id");
    const station = STATIONS.find((s) => s.id === id);

    if (!id || !station) {
      const msg = encodeURIComponent("Station not found. Showing station list instead.");
      location.replace(`./index.html?msg=${msg}#stations`);
      return;
    }

    document.title = `City Police — ${station.name}`;

    $("#stationName").textContent = station.name;
    $("#stationMeta").textContent = `${station.area} · ${station.postcode}`;

    $("#stationAddress").innerHTML = `
      <strong>${escapeHtml(station.name)}</strong><br/>
      ${escapeHtml(station.addressLines.join(", "))}<br/>
      ${escapeHtml(station.postcode)}
    `;

    const phoneEl = $("#stationPhone");
    phoneEl.textContent = station.phone;
    phoneEl.href = formatPhoneHref(station.phone);

    const emailEl = $("#stationEmail");
    emailEl.textContent = station.email;
    emailEl.href = `mailto:${station.email}`;

    const callBtn = $("#callBtn");
    if (callBtn) callBtn.href = formatPhoneHref(station.phone);

    const directionsBtn = $("#directionsBtn");
    if (directionsBtn) directionsBtn.href = osmDirectionsUrl(station.lat, station.lon);

    const hoursList = $("#hoursList");
    hoursList.innerHTML = station.hours
      .map(([day, hrs]) => `<li><strong>${escapeHtml(day)}:</strong> ${escapeHtml(hrs)}</li>`)
      .join("");

    const map = $("#mapFrame");
    map.src = osmEmbedUrl(station.lat, station.lon);
  }

  // --- flash messages
  function initFlash() {
    const msg = getFlashFromUrl();
    if (msg) showFlash(msg);
  }

  // --- boot
  function init() {
    setYear();
    initFlash();
    setupAlertDemo();
    setupReportForm();
    setupStationSearch();
    renderStationPage();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
