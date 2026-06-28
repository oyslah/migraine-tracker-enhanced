import * as React from 'react';
import Chart from 'chart.js/auto';
import annotationPlugin from 'chartjs-plugin-annotation';

Chart.register(annotationPlugin);

const ChartComponent = ({ type, data, options }) => {
  const canvasRef = React.useRef(null);
  const chartRef = React.useRef(null);

  React.useEffect(() => {
    if (!canvasRef.current) return;
    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    if (chartRef.current) {
      // Update existing chart in-place — no flash or recreate
      chartRef.current.data = data;
      chartRef.current.options = options;
      chartRef.current.config.type = type;
      chartRef.current.update();
    } else {
      chartRef.current = new Chart(context, { type, data, options });
    }

    return () => {
      chartRef.current?.destroy();
      chartRef.current = null;
    };
  }, [type, data, options]);

  return React.createElement('canvas', { ref: canvasRef });
};

export default ChartComponent;
