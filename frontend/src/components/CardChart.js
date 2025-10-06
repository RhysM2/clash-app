import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { motion } from 'framer-motion';
import './CardChart.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

function CardChart({ cards }) {
  // Take top 15 cards
  const topCards = cards.slice(0, 15);

  // Generate gradient colors based on rarity
  const getCardColor = (card, alpha = 1) => {
    const rarityColors = {
      common: `rgba(148, 163, 184, ${alpha})`,     // Gray
      rare: `rgba(245, 158, 11, ${alpha})`,        // Orange
      epic: `rgba(168, 85, 247, ${alpha})`,        // Purple
      legendary: `rgba(251, 191, 36, ${alpha})`,   // Gold
      champion: `rgba(6, 182, 212, ${alpha})`      // Cyan
    };

    const rarity = card.metadata?.rarity?.toLowerCase() || 'common';
    return rarityColors[rarity] || rarityColors.common;
  };

  const data = {
    labels: topCards.map(card => card.name),
    datasets: [
      {
        label: 'Times Faced',
        data: topCards.map(card => card.count),
        backgroundColor: topCards.map(card => getCardColor(card, 0.8)),
        borderColor: topCards.map(card => getCardColor(card, 1)),
        borderWidth: 2,
        borderRadius: 8,
        barThickness: 40,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 1500,
      easing: 'easeInOutQuart',
      delay: (context) => {
        return context.dataIndex * 50;
      }
    },
    plugins: {
      legend: {
        display: false
      },
      title: {
        display: true,
        text: '📊 Most Common Opponent Cards (Top 15)',
        color: '#FFFFFF',
        font: {
          size: 18,
          weight: 'bold',
          family: 'Arial, sans-serif'
        },
        padding: {
          top: 10,
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: '#1A2332',
        titleColor: '#FFFFFF',
        bodyColor: '#94A3B8',
        borderColor: '#A855F7',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          title: (context) => {
            const card = topCards[context[0].dataIndex];
            return `${card.name} ${card.metadata?.rarity ? `(${card.metadata.rarity})` : ''}`;
          },
          label: (context) => {
            const card = topCards[context.dataIndex];
            const percentage = (card.percentage * 100).toFixed(1);
            return [
              `Faced: ${context.parsed.y} times (${percentage}%)`,
              card.winRate !== null ? `Win Rate: ${(card.winRate * 100).toFixed(1)}%` : '',
              card.metadata?.elixirCost ? `Elixir: ${card.metadata.elixirCost}` : ''
            ].filter(Boolean);
          },
          labelColor: (context) => {
            const card = topCards[context.dataIndex];
            return {
              borderColor: getCardColor(card, 1),
              backgroundColor: getCardColor(card, 0.8)
            };
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#94A3B8',
          font: {
            size: 12
          },
          stepSize: 1
        },
        grid: {
          color: 'rgba(45, 55, 72, 0.5)',
          borderColor: '#2D3748'
        },
        title: {
          display: true,
          text: 'Times Encountered',
          color: '#94A3B8',
          font: {
            size: 14,
            weight: '600'
          }
        }
      },
      x: {
        ticks: {
          color: '#94A3B8',
          font: {
            size: 11
          },
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          display: false
        }
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    }
  };

  return (
    <motion.div
      className="card-chart-container"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
    >
      <div className="chart-wrapper">
        <Bar data={data} options={options} />
      </div>
    </motion.div>
  );
}

export default CardChart;
