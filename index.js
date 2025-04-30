document.addEventListener("DOMContentLoaded", () => {
    const server = "http://mahir.iotexperience.com"; // Replace with your server URL
    const tableBody = document.getElementById("table-body");
    const loadingIndicator = document.getElementById("loading");
    const chartSection = document.querySelector(".chart-section");
    const chartTitle = document.getElementById("chart-title");
    const chartPlaceholder = document.getElementById("chart-placeholder");
    const chartContainer = document.getElementById("chart-container");
    let selectedDeviceId = null; // Track the selected device ID
    let selectedRow = null; // Track the currently selected row
  
    // Declare chart instances
    let tempChart = null;
    let humiChart = null;
    let pressureChart = null;
    let pm1Chart = null;
    let pm25Chart = null;
    let pm10Chart = null;
    let co2Chart = null;
  
    const fetchData = async () => {
      try {
        const response = await fetch(`${server}/cfd/get-latest-all`);
        if (!response.ok) {
          throw new Error("Failed to fetch data");
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
      if (!selectedDeviceId) return; // No device selected, skip fetching chart data
  
      try {
        const response = await fetch(`${server}/cfd/get-last-50/${selectedDeviceId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch chart data");
        }
        const result = await response.json();
  
        // Check if required fields exist before updating charts
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
          console.error("Error in chart data response: Missing required fields");
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
          <td>${item.id}</td>
          <td>${item.deviceid}</td>
          <td>${item.air_temperature}</td>
          <td>${item.humidity}</td>
          <td>${item.pressure}</td>
          <td>${item.altitude}</td>
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
      // Remove highlight from the previously selected row
      if (selectedRow) {
        selectedRow.classList.remove("table-primary");
      }
  
      // Highlight the clicked row
      row.classList.add("table-primary");
      selectedRow = row;
  
      // Update the selected device ID and fetch chart data
      selectedDeviceId = deviceId;
  
      // Update chart section visibility and title
      chartTitle.textContent = `Device ${deviceId} Charts`;
      chartPlaceholder.style.display = "none";
      chartContainer.style.display = "flex";
  
      fetchChartData();
    };
  
    const updateCharts = (labels, temperatures, humidities, pressures, pm1s, pm25s, pm10s, co2s) => {
      tempChart = createOrUpdateChart(tempChart, "tempChart", "Temperature (°C)", labels, temperatures);
      humiChart = createOrUpdateChart(humiChart, "humiChart", "Humidity (%)", labels, humidities);
      pressureChart = createOrUpdateChart(pressureChart, "pressureChart", "Pressure (Pa)", labels, pressures);
      pm1Chart = createOrUpdateChart(pm1Chart, "pm1Chart", "PM1 (µg/m³)", labels, pm1s);
      pm25Chart = createOrUpdateChart(pm25Chart, "pm25Chart", "PM2.5 (µg/m³)", labels, pm25s);
      pm10Chart = createOrUpdateChart(pm10Chart, "pm10Chart", "PM10 (µg/m³)", labels, pm10s);
      co2Chart = createOrUpdateChart(co2Chart, "co2Chart", "CO2 (ppm)", labels, co2s);
    };
  
    const createOrUpdateChart = (chart, canvasId, label, labels, data) => {
      const ctx = document.getElementById(canvasId).getContext("2d");
      if (chart) {
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        chart.update();
      } else {
        chart = new Chart(ctx, {
          type: "line",
          data: {
            labels: labels,
            datasets: [
              {
                label: label,
                data: data,
                borderColor: "rgba(75, 192, 192, 1)",
                backgroundColor: "rgba(75, 192, 192, 0.2)",
                borderWidth: 1,
              },
            ],
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: true,
              },
            },
          },
        });
      }
      return chart;
    };
  
    // Fetch data every 2 seconds
    fetchData();
    setInterval(fetchChartData, 2000); // Refresh chart data every 2 seconds
  });