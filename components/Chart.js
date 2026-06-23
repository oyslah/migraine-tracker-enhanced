import * as React from 'react';
import Chart from 'chart.js/auto';

const ChartComponent = ({ type, data, options }) => {
  const canvasRef = React.useRef(null);

  React.useEffect(() => {
    let chartInstance = null;
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        chartInstance = new Chart(context, {
          type,
          data,
          options,
        });
      }
    }

    return () => {
      chartInstance?.destroy();
    };
  }, [type, data, options]);

  return React.createElement('canvas', { ref: canvasRef });
};

export default ChartComponent;