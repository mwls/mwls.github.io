const ctx = document.getElementById('myChart');

const myChart = new Chart(ctx, {
    type: 'line',

    data: {
        labels: labels,
        datasets: [
              {
                label: "Citations",
                data: citationValues,
                borderColor: 'rgba(255, 99, 132, 0.8)',
                backgroundColor: 'rgba(255, 99, 132, 0.2)',
                yAxisID: 'y',
              },
              {
                label: "Reads",
                data: readValues,
                borderColor: 'rgba(54, 162, 235, 0.8)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                yAxisID: 'y1',
              }
            ]
    },
    options: {
        responsive: true,
        interaction:{
          mode: 'index',
          interstect: false,
          },
        stacked: false,
        scales: {
            y: {
                type: 'linear',
                display: true,
                position: 'left',
                beginAtZero: true,
                title: {
                  display: true,
                  text: 'Number of Citations'
                }
            },
            y1: {
              type: 'linear',
              display: true,
              position: 'right',
              beginAtZero: true,
              title: {
                display: true,
                text: 'Number of ADS Reads'
              },

              // grid line settings
              grid: {
                drawOnChartArea: false,
              },
            },
            x: {
              display:true,
              title: {
                display: true,
                text: 'Year'
              },
            }
        }
    },
});
