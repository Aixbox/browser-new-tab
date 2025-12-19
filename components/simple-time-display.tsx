"use client";

import { useState, useEffect } from "react";

interface TimeData {
  currentTime: Date;
  lunarCalendar: string;
  networkTime?: string;
}

export const SimpleTimeDisplay = () => {
  const [timeData, setTimeData] = useState<TimeData>({
    currentTime: new Date(),
    lunarCalendar: ""
  });

  // 获取农历信息
  const getLunarInfo = (date: Date) => {
    try {
      // 动态导入农历库
      import('lunar-javascript').then(({ Lunar, Solar }) => {
        const solar = Solar.fromDate(date);
        const lunar = solar.getLunar();
        const lunarStr = `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`;
        
        setTimeData(prev => ({
          ...prev,
          lunarCalendar: lunarStr
        }));
      }).catch(error => {
        console.error('农历库加载失败:', error);
        setTimeData(prev => ({
          ...prev,
          lunarCalendar: ""
        }));
      });
    } catch (error) {
      console.error('获取农历信息失败:', error);
    }
  };

  // 更新本地时间
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeData(prev => ({
        ...prev,
        currentTime: now
      }));
    };

    // 立即更新一次
    updateTime();

    // 每秒更新时间
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  // 更新农历信息（每天更新一次）
  useEffect(() => {
    getLunarInfo(timeData.currentTime);
    
    // 每小时检查一次是否需要更新农历
    const lunarTimer = setInterval(() => {
      getLunarInfo(timeData.currentTime);
    }, 3600000);

    return () => clearInterval(lunarTimer);
  }, [timeData.currentTime.getDate()]); // 当日期变化时更新

  // 获取网络时间（可选，用于校准）
  const fetchNetworkTime = async () => {
    try {
      const timeResponse = await fetch('https://worldtimeapi.org/api/timezone/Asia/Shanghai');
      if (timeResponse.ok) {
        const timeResult = await timeResponse.json();
        setTimeData(prev => ({
          ...prev,
          networkTime: timeResult.datetime
        }));
      }
    } catch (error) {
      console.error('获取网络时间失败:', error);
    }
  };

  // 组件加载时获取网络时间
  useEffect(() => {
    fetchNetworkTime();
  }, []);

  // 格式化时间显示
  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekday = date.toLocaleDateString('zh-CN', { weekday: 'long' });
    
    return {
      time: `${hours}:${minutes}:${seconds}`,
      date: `${month}月${day}日`,
      weekday
    };
  };

  const { time, date, weekday } = formatTime(timeData.currentTime);

  return (
    <div className="text-center text-white">
      {/* 大号时间显示 */}
      <div className="text-6xl font-mono font-light tracking-wider mb-2">
        {time}
      </div>
      
      {/* 小号日期信息 */}
      <div className="text-lg text-white/90 space-x-4">
        <span>{date}</span>
        <span>{weekday}</span>
        {timeData.lunarCalendar && (
          <span>{timeData.lunarCalendar}</span>
        )}
      </div>
    </div>
  );
};