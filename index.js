document.addEventListener("DOMContentLoaded", () => {
  // All calls to /cfd/* will go to your Netlify site over HTTPS,
  // and Netlify will proxy them to http://mahir.iotexperience.com.
  const tableBody = document.getElementById("table-body");
  const loadingIndicator = document.getElementById("loading");
  const chartSection = document.querySelector(".chart-section");
  const chartTitle = document.getElementById("chart-title");
  const chartPlaceholder = document.getElementById("chart-placeholder");
  const chartContainer = document.getElementById("chart-container");
  let selectedDeviceId = null; // Track the selected device ID
  let selectedRow = null;      // Track the currently selected row

  // Chart instances
  let tempChart = null;
  let humiChart = null;
  let pressureChart = null;
  let pm1Chart = null;
  let pm25Chart = null;
  let pm10Chart = null;
  let co2Chart = null;

  const fetchData = async () => {
    try {
      const response = await fetch(`/cfd/get-latest-all`);
      if (!response.ok) {
        throw new Error(`Failed to fetch data (status ${response.status})`);
      }
      const result = await response.json();
      if (result.status === "success") {
        populateTable(result.data);
      } else {
        console.error("Error in response:", result.message);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      loadingIndicator.style.display = "none";
    }
  };

  const fetchChartData = async () => {
    if (!selectedDeviceId) return; // No device selected

    try {
      const response = await fetch(`/cfd/get-last-50/${selectedDeviceId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch chart data (status ${response.status})`);
      }
      const result = await response.json();

      if (result.time && result.temperature && result.humidity) {
        updateCharts(
          result.time,
          result.temperature,
          result.humidity,
          result.pressure || [],
          result.pm1 || [],
          result.pm2_5 || [],
          result.pm10 || [],
          result.co2 || []
        );
      } else {
        console.error("Chart data missing required fields:", result);
      }
    } catch (error) {
      console.error("Error fetching chart data:", error);
    }
  };

  const populateTable = (data) => {
    tableBody.innerHTML = ""; // Clear existing rows
    data.forEach((item) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${item.deviceid}</td>
        <td>${item.air_temperature}</td>
        <td>${item.humidity}</td>
        <td>${item.pressure}</td>
        <td>${item.pm1}</td>
        <td>${item.pm2_5}</td>
        <td>${item.pm10}</td>
        <td>${item.co2}</td>
        <td>${new Date(item.timestamp).toLocaleString()}</td>
      `;
      row.addEventListener("click", () => handleRowClick(row, item.deviceid));
      tableBody.appendChild(row);
    });
  };

  const handleRowClick = (row, deviceId) => {
    // Un-highlight previous row
    if (selectedRow) {
      selectedRow.classList.remove("table-primary");
    }
    // Highlight new row
    row.classList.add("table-primary");
    selectedRow = row;

    selectedDeviceId = deviceId;
    chartTitle.textContent = `Device ${deviceId} Charts`;
    chartPlaceholder.style.display = "none";
    chartContainer.style.display = "flex";

    fetchChartData();
  };

  const createOrUpdateChart = (chartId, title, xData, yData, yLabel) => {
    const chartElement = document.getElementById(chartId);
  
    const trace = {
      x: xData,
      y: yData,
      mode: "lines+markers",
      name: yLabel,
    };
  
    const layout = {
      title: title,
      xaxis: { title: "Time" },
      yaxis: { title: yLabel },
      margin: { t: 40, l: 50, r: 30, b: 50 },
      responsive: true,
    };
  
    // If the chart already exists, update it
    if (chartElement.data) {
      Plotly.react(chartElement, [trace], layout);
    } else {
      // Create a new chart
      Plotly.newPlot(chartElement, [trace], layout);
    }
  };
  
  const updateCharts = (labels, temperatures, humidities, pressures, pm1s, pm25s, pm10s, co2s) => {
    createOrUpdateChart("tempChart", "Temperature (°C)", labels, temperatures, "Temperature (°C)");
    createOrUpdateChart("humiChart", "Humidity (%)", labels, humidities, "Humidity (%)");
    createOrUpdateChart("pressureChart", "Pressure (Pa)", labels, pressures, "Pressure (Pa)");
    createOrUpdateChart("pm1Chart", "PM1 (µg/m³)", labels, pm1s, "PM1 (µg/m³)");
    createOrUpdateChart("pm25Chart", "PM2.5 (µg/m³)", labels, pm25s, "PM2.5 (µg/m³)");
    createOrUpdateChart("pm10Chart", "PM10 (µg/m³)", labels, pm10s, "PM10 (µg/m³)");
    createOrUpdateChart("co2Chart", "CO₂ (ppm)", labels, co2s, "CO₂ (ppm)");
  };

  // Initial load
  fetchData();
  setInterval(fetchData, 4000);
  setInterval(fetchChartData, 4000);
});