---
title: Rating 计算器
date: 2025-08-28 11:16:55
tags: [中二节奏]
excerpt: 中二单曲 Rating 计算器
---

单曲定数 + 分数

<div>
  <input id="num1" type="number" placeholder="单曲定数">
  <input id="num2" type="number" placeholder="分数">
  <button onclick="showSum()">计算 Rating</button>
  <p id="result"></p>
</div>

<style>
  input[type="number"], button {
    font-size: 1.2em;
    padding: 5px;
  }

  #result {
    font-size: 1.5em;
    font-weight: bold;
    text-align: center;
    margin-top: 10px;
  }
</style>

<script>
  function calcChartRating(baseLevel, score) {
    if (score >= 1009000) {
      return baseLevel + 2.15;
    } else if (score >= 1007500) {
      let ratio = (score - 1007500) / 2500.0;
      return baseLevel + 2.0 + 0.15 * ratio;
    } else if (score >= 1005000) {
      let ratio = (score - 1005000) / 2500.0;
      return baseLevel + 1.5 + 0.5 * ratio;
    } else if (score >= 1000000) {
      let ratio = (score - 1000000) / 5000.0;
      return baseLevel + 1.0 + 0.5 * ratio;
    } else if (score >= 990000) {
      let ratio = (score - 990000) / 10000.0;
      return baseLevel + 0.4 * ratio;
    } else if (score >= 975000) {
      let ratio = (score - 975000) / 15000.0;
      return baseLevel + 0.6 * ratio;
    } else if (score >= 925000) {
      let ratio = (score - 925000) / 50000.0;
      return baseLevel - 3.0 + 3.0 * ratio;
    } else if (score >= 900000) {
      let ratio = (score - 900000) / 25000.0;
      return baseLevel - 5.0 + 2.0 * ratio;
    } else if (score >= 800000) {
      let r_start = (baseLevel - 5.0) / 2.0;
      let r_end = baseLevel - 5.0;
      let ratio = (score - 800000) / 100000.0;
      return r_start + (r_end - r_start) * ratio;
    } else if (score >= 500000) {
      let r_start = 0.0;
      let r_end = (baseLevel - 5.0) / 2.0;
      let ratio = (score - 500000) / 300000.0;
      return r_start + (r_end - r_start) * ratio;
    } else {
      return 0.0;
    }
  }

  function showSum() {
    const baseLevel = parseFloat(document.getElementById('num1').value) || 0;
    const score = parseInt(document.getElementById('num2').value) || 0;
    const rating = calcChartRating(baseLevel, score);
    document.getElementById('result').innerText = "Rating: " + rating.toFixed(2);
  }
</script>
    