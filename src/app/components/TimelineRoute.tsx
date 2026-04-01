import React, { useState, useEffect, useRef } from 'react';
import { Button } from './ui/button';
import { LogOut, Plus, Save, Calendar, Edit3, Check, X, Trash2, Eye, EyeOff, CalendarDays, Download } from 'lucide-react';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';

interface CellData {
  id: string;
  value: string;
  status?: 'completed' | 'pending';
}

interface CellData {
  value: string;
  status?: 'completed' | 'pending';
}

interface FiscalYearData {
  name: string; // e.g., "FY2526"
  columns: string[]; // 12 months
  cells: { [key: string]: CellData };
}

interface TimelineData {
  rows: string[];
  fiscalYears: FiscalYearData[];
}

interface TimelineRouteProps {
  onLogout: () => void;
  onSwitchView?: () => void;
}

// 工厂统一颜色 - 优雅的深蓝色
const ROUTE_COLOR = '#3b82f6';

// FY2526 cells data from the uploaded photo
const FY2526_CELLS: { [key: string]: CellData } = {
  // Common row (rowIndex: 0)
  '0-0': { value: 'BU SDES', status: 'pending' },
  '0-1': { value: 'ESS SDES-8/8', status: 'pending' },
  '0-2': { value: 'NSS WS-9/15-19', status: 'pending' },
  '0-3': { value: 'ESS QBU 10/31\nPoe review-10/28', status: 'pending' },
  '0-4': { value: '洗涤行业展会\n11/12', status: 'pending' },
  '0-5': { value: 'TRL Workshop\n12/7,8,9\nWX benchmark visit\n12/18', status: 'pending' },
  '0-6': { value: 'ESS Offsite Meeting\n1/29\nPDD at CD 1/20\nPoe review-1/28', status: 'pending' },
  '0-8': { value: 'Poe QBU 3/2\nT&W Workshop-3/20\nNSS WS-3/31 & 4/1', status: 'pending' },
  '0-9': { value: 'ESS QBU\n4/24', status: 'pending' },
  '0-11': { value: 'PDD 6/11&12', status: 'pending' },
  // TSL row (rowIndex: 1)
  '1-0': { value: 'Vaule\nCreation WS', status: 'pending' },
  '1-3': { value: 'TSL-POSM test\n10/20,21,22', status: 'pending' },
  '1-6': { value: 'Poe visit-1/13', status: 'pending' },
  // NSLK row (rowIndex: 2)
  '2-4': { value: 'Seema\nvisit-11/10', status: 'pending' },
  '2-6': { value: 'Poe visit-tbd', status: 'pending' },
  '2-10': { value: 'Value Creation WS\n时间TBD', status: 'pending' },
  // SK row (rowIndex: 3)
  '3-1': { value: 'Charles\nvisit-8/26', status: 'pending' },
  '3-4': { value: 'Charles\nvisit-11/25', status: 'pending' },
  '3-6': { value: 'SK QAC-1/7-1/9\nValue Creation WS 1/15', status: 'pending' },
  '3-8': { value: 'Charles Visit 3/24', status: 'pending' },
  '3-9': { value: 'Poe Visit-TBD', status: 'pending' },
  // CS row (rowIndex: 4)
  '4-1': { value: 'Poe visit-8/12', status: 'pending' },
  '4-4': { value: 'POSS\nRenew-11/13,14', status: 'pending' },
  '4-11': { value: 'Poe Visit-TBD', status: 'pending' },
  // LYLK row (rowIndex: 5) - empty in photo
};

export function TimelineRoute({ onLogout, onSwitchView }: TimelineRouteProps) {
  const [data, setData] = useState<TimelineData>({
    rows: ['Common', 'TSL', 'NSLK', 'SK', 'CS', 'LYLK'],
    fiscalYears: [
      {
        name: 'FY2526',
        columns: ['Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
        cells: FY2526_CELLS
      }
    ]
  });
  const [isLoading, setIsLoading] = useState(true);

  const [currentFYIndex, setCurrentFYIndex] = useState(0);
  
  // Get current FY data
  const currentFY = data.fiscalYears[currentFYIndex] || data.fiscalYears[0];
  const columns = currentFY.columns;
  const cells = currentFY.cells;

  const [editingCell, setEditingCell] = useState<{ rowIndex: number; colIndex: number } | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [addRowDialog, setAddRowDialog] = useState(false);
  const [addColumnDialog, setAddColumnDialog] = useState(false);
  const [newRowName, setNewRowName] = useState('');
  const [newColumnName, setNewColumnName] = useState('');
  const [showHeader, setShowHeader] = useState(true);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [fiscalYearDialog, setFiscalYearDialog] = useState(false);
  const [newFiscalYear, setNewFiscalYear] = useState('');
  const [editingRowName, setEditingRowName] = useState<{ index: number; name: string } | null>(null);
  const [deleteRowConfirm, setDeleteRowConfirm] = useState<{ index: number; name: string } | null>(null);

  // Generate Fiscal Year columns (July - June)
  const generateFiscalYearColumns = (fy: string): string[] => {
    // Parse FY2526 format
    const match = fy.match(/FY(\d{2})(\d{2})/i);
    if (!match) return [];
    
    const startYear = 2000 + parseInt(match[1]);
    const endYear = 2000 + parseInt(match[2]);
    
    const months: string[] = [];
    // July - December of start year
    for (let i = 7; i <= 12; i++) {
      months.push(`${startYear}年${i}月`);
    }
    // January - June of end year
    for (let i = 1; i <= 6; i++) {
      months.push(`${endYear}年${i}月`);
    }
    return months;
  };

  const addFiscalYear = () => {
    if (newFiscalYear && newFiscalYear.match(/FY\d{2}\d{2}/i)) {
      const fyName = newFiscalYear.toUpperCase();
      // Check if already exists
      if (data.fiscalYears.some(fy => fy.name === fyName)) {
        toast.error('Fiscal Year 已存在', {
          description: `${fyName} 已经添加过了`,
        });
        return;
      }
      
      const newColumns = generateFiscalYearColumns(fyName);
      if (newColumns.length > 0) {
        const newFY: FiscalYearData = {
          name: fyName,
          columns: newColumns,
          cells: {}
        };
        setData({
          ...data,
          fiscalYears: [...data.fiscalYears, newFY]
        });
        // Switch to the new FY
        setCurrentFYIndex(data.fiscalYears.length);
        toast.success(`已添加 ${fyName}`, {
          description: `已切换到 ${fyName}`,
        });
        setNewFiscalYear('');
        setFiscalYearDialog(false);
      }
    } else {
      toast.error('格式错误', {
        description: '请输入格式如：FY2526',
      });
    }
  };

  const deleteFiscalYear = (index: number) => {
    if (data.fiscalYears.length <= 1) {
      toast.error('无法删除', {
        description: '至少保留一个 Fiscal Year',
      });
      return;
    }
    
    const newFiscalYears = [...data.fiscalYears];
    const deletedName = newFiscalYears[index].name;
    newFiscalYears.splice(index, 1);
    
    setData({ ...data, fiscalYears: newFiscalYears });
    
    // Adjust current index if needed
    if (currentFYIndex >= index && currentFYIndex > 0) {
      setCurrentFYIndex(currentFYIndex - 1);
    }
    
    toast.success('已删除 Fiscal Year', {
      description: deletedName,
    });
  };

  // Handle row name double click
  const handleRowNameDoubleClick = (index: number, name: string) => {
    setEditingRowName({ index, name });
  };

  // Handle row name edit confirm
  const handleRowNameConfirm = () => {
    if (editingRowName && editingRowName.name.trim()) {
      const newRows = [...data.rows];
      newRows[editingRowName.index] = editingRowName.name.trim();
      setData({ ...data, rows: newRows });
      toast.success('工厂名称已更新');
    }
    setEditingRowName(null);
  };

  // Handle row name edit cancel
  const handleRowNameCancel = () => {
    setEditingRowName(null);
  };

  // Handle row name input change
  const handleRowNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (editingRowName) {
      setEditingRowName({ ...editingRowName, name: e.target.value });
    }
  };

  // Delete row
  const deleteRow = (index: number) => {
    if (data.rows.length <= 1) {
      toast.error('至少保留一个工厂');
      return;
    }
    
    const newRows = [...data.rows];
    newRows.splice(index, 1);
    
    // Update cells - shift all cells below up
    const newFiscalYears = data.fiscalYears.map(fy => {
      const newCells: { [key: string]: CellData } = {};
      Object.entries(fy.cells).forEach(([key, value]) => {
        const [rowIdx, colIdx] = key.split('-').map(Number);
        if (rowIdx < index) {
          newCells[key] = value;
        } else if (rowIdx > index) {
          newCells[`${rowIdx - 1}-${colIdx}`] = value;
        }
        // Skip the deleted row
      });
      return { ...fy, cells: newCells };
    });
    
    setData({ ...data, rows: newRows, fiscalYears: newFiscalYears });
    
    // Adjust current FY index if needed
    if (currentFYIndex >= index && currentFYIndex > 0) {
      setCurrentFYIndex(currentFYIndex - 1);
    }
    
    toast.success('工厂已删除');
    setDeleteRowConfirm(null);
  };

  // Show delete row confirmation
  const showDeleteRowConfirm = (index: number, name: string) => {
    setDeleteRowConfirm({ index, name });
  };

  // Export to Excel
  const exportToExcel = () => {
    try {
      const currentFY = data.fiscalYears[currentFYIndex];
      const rows = data.rows;
      const columns = currentFY.columns;
      const cells = currentFY.cells;

      // Prepare worksheet data
      const wsData: (string | null)[][] = [];

      // Header row
      const headerRow = ['工厂', ...columns];
      wsData.push(headerRow);

      // Data rows
      rows.forEach((rowName, rowIndex) => {
        const rowData: (string | null)[] = [rowName];
        columns.forEach((_, colIndex) => {
          const key = `${rowIndex}-${colIndex}`;
          const cellData = cells[key];
          rowData.push(cellData ? cellData.value : null);
        });
        wsData.push(rowData);
      });

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData);

      // Set column widths
      const colWidths = [{ wch: 15 }]; // First column (factory name)
      columns.forEach(() => colWidths.push({ wch: 20 })); // Data columns
      ws['!cols'] = colWidths;

      // Create workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, currentFY.name);

      // Generate filename
      const filename = `日历_${currentFY.name}_${new Date().toISOString().split('T')[0]}.xlsx`;

      // Save file
      XLSX.writeFile(wb, filename);

      toast.success('导出成功', {
        description: `已导出 ${filename}`,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('导出失败', {
        description: '请重试',
      });
    }
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const key = `${rowIndex}-${colIndex}`;
    const cellData = cells[key];
    // Directly start editing
    setEditingCell({ rowIndex, colIndex });
    setTempValue(cellData?.value || '');
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const key = `${editingCell.rowIndex}-${editingCell.colIndex}`;
      const newFiscalYears = [...data.fiscalYears];
      const newCells = { ...newFiscalYears[currentFYIndex].cells };
      
      if (tempValue.trim() === '') {
        delete newCells[key];
      } else {
        newCells[key] = {
          value: tempValue,
          status: newCells[key]?.status || 'pending'
        };
      }
      
      newFiscalYears[currentFYIndex] = {
        ...newFiscalYears[currentFYIndex],
        cells: newCells
      };
      
      setData({ ...data, fiscalYears: newFiscalYears });
      setEditingCell(null);
      toast.success('事件已保存');
    }
  };

  const handleCellKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCellBlur();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setTempValue('');
    }
  };

  const toggleCellStatus = (rowIndex: number, colIndex: number) => {
    const key = `${rowIndex}-${colIndex}`;
    const newFiscalYears = [...data.fiscalYears];
    const newCells = { ...newFiscalYears[currentFYIndex].cells };
    
    if (!newCells[key]) return;
    
    newCells[key] = {
      ...newCells[key],
      status: newCells[key].status === 'completed' ? 'pending' : 'completed'
    };
    
    newFiscalYears[currentFYIndex] = {
      ...newFiscalYears[currentFYIndex],
      cells: newCells
    };
    
    setData({ ...data, fiscalYears: newFiscalYears });
    toast.success(
      newCells[key].status === 'completed' ? '标记为已完成' : '标记为进行中',
      { duration: 2000 }
    );
  };

  const deleteEvent = (rowIndex: number, colIndex: number) => {
    const key = `${rowIndex}-${colIndex}`;
    const newFiscalYears = [...data.fiscalYears];
    const newCells = { ...newFiscalYears[currentFYIndex].cells };
    delete newCells[key];
    
    newFiscalYears[currentFYIndex] = {
      ...newFiscalYears[currentFYIndex],
      cells: newCells
    };
    
    setData({ ...data, fiscalYears: newFiscalYears });
    toast.success('事件已删除');
  };

  const addRow = () => {
    if (newRowName && newRowName.trim()) {
      setData({
        ...data,
        rows: [...data.rows, newRowName.trim()]
      });
      toast.success('已添加新工厂', {
        description: `新增：${newRowName.trim()}`,
      });
      setNewRowName('');
      setAddRowDialog(false);
    }
  };

  const addColumn = () => {
    if (newColumnName && newColumnName.trim()) {
      const newFiscalYears = [...data.fiscalYears];
      newFiscalYears[currentFYIndex] = {
        ...newFiscalYears[currentFYIndex],
        columns: [...newFiscalYears[currentFYIndex].columns, newColumnName.trim()]
      };
      setData({ ...data, fiscalYears: newFiscalYears });
      toast.success('已添加新月份', {
        description: `新增：${newColumnName.trim()}`,
      });
      setNewColumnName('');
      setAddColumnDialog(false);
    }
  };

  // 保存数据到 Supabase
  const saveData = async () => {
    try {
      // 如果正在编辑单元格，先保存编辑的内容
      if (editingCell) {
        const key = `${editingCell.rowIndex}-${editingCell.colIndex}`;
        const newFiscalYears = [...data.fiscalYears];
        const newCells = { ...newFiscalYears[currentFYIndex].cells };
        
        if (tempValue.trim() === '') {
          delete newCells[key];
        } else {
          newCells[key] = {
            value: tempValue,
            status: newCells[key]?.status || 'pending'
          };
        }
        
        newFiscalYears[currentFYIndex] = {
          ...newFiscalYears[currentFYIndex],
          cells: newCells
        };
        
        setData({ ...data, fiscalYears: newFiscalYears });
        setEditingCell(null);
      }
      
      console.log('Saving data to Supabase...');
      console.log('Data to save:', JSON.stringify(data, null, 2));
      
      // 先查询现有记录
      const { data: existingData, error: fetchError } = await supabase
        .from('calendar_data')
        .select('id')
        .limit(1)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching existing data:', fetchError);
        throw fetchError;
      }

      let result;
      let error;
      
      if (existingData && existingData.id) {
        // 如果存在记录，则更新
        console.log('Updating existing record:', existingData.id);
        console.log('Update payload:', {
          rows: data.rows,
          fiscal_years: data.fiscalYears,
          updated_at: new Date().toISOString()
        });
        result = await supabase
          .from('calendar_data')
          .update({
            rows: data.rows,
            fiscal_years: data.fiscalYears,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingData.id);
        error = result.error;
        console.log('Update result:', result);
      } else {
        // 如果不存在记录，则插入
        console.log('Inserting new record');
        console.log('Insert payload:', {
          rows: data.rows,
          fiscal_years: data.fiscalYears,
          updated_at: new Date().toISOString()
        });
        result = await supabase
          .from('calendar_data')
          .insert({
            rows: data.rows,
            fiscal_years: data.fiscalYears,
            updated_at: new Date().toISOString()
          });
        error = result.error;
        console.log('Insert result:', result);
      }

      if (error) {
        console.error('Error in database operation:', error);
        throw error;
      }
      
      console.log('Data saved successfully');
      
      localStorage.setItem('timelineData', JSON.stringify(data));
      localStorage.setItem('currentFYIndex', currentFYIndex.toString());
      toast.success('数据已保存', {
        description: '所有更改已成功保存到 Supabase',
      });
    } catch (error) {
      console.error('Error saving data:', error);
      toast.error('保存失败', {
        description: '请重试',
      });
    }
  };

  // 从 Supabase 加载数据
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Loading data from Supabase...');
        const { data: supabaseData, error } = await supabase
          .from('calendar_data')
          .select('*')
          .limit(1)
          .single();

        if (error) {
          console.error('Supabase load error:', error);
          throw error;
        }
        
        console.log('Raw Supabase data:', supabaseData);
        console.log('fiscal_years type:', typeof supabaseData.fiscal_years);
        console.log('fiscal_years is array?', Array.isArray(supabaseData.fiscal_years));
        
        if (supabaseData && supabaseData.fiscal_years) {
          const timelineData: TimelineData = {
            rows: supabaseData.rows || [],
            fiscalYears: Array.isArray(supabaseData.fiscal_years) ? supabaseData.fiscal_years : []
          };
          setData(timelineData);
          console.log('Data loaded from Supabase:', timelineData);
          
          // Restore FY after data is loaded
          const savedFY = localStorage.getItem(FY_KEY);
          if (savedFY) {
            const fyIndex = parseInt(savedFY);
            if (fyIndex >= 0 && fyIndex < timelineData.fiscalYears.length) {
              setCurrentFYIndex(fyIndex);
              console.log('Restored FY index:', fyIndex);
            }
          }
        } else {
          console.log('No data in Supabase, using initial data');
        }
      } catch (error) {
        console.error('Failed to load data from Supabase:', error);
        console.log('Using initial data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // 实时订阅数据变化 - 暂时禁用，避免覆盖数据
  // useEffect(() => {
  //   const channel = supabase
  //     .channel('calendar-updates')
  //     .on(
  //       'postgres_changes',
  //       {
  //         event: 'UPDATE',
  //         schema: 'public',
  //         table: 'calendar_data'
  //       },
  //       (payload) => {
  //         const newData = payload.new as any;
  //         if (newData && newData.fiscal_years) {
  //           console.log('Real-time update received');
  //           setData({
  //             rows: newData.rows,
  //             fiscalYears: newData.fiscal_years
  //           });
  //           toast.info('数据已同步', { duration: 2000 });
  //         }
  //       }
  //     )
  //     .subscribe();

  //   return () => {
  //     supabase.removeChannel(channel);
  //   };
  // }, []);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const SCROLL_KEY = 'timeline_scroll_position';
  const FY_KEY = 'timeline_current_fy';

  // Save scroll position
  const saveScrollPosition = () => {
    if (containerRef.current) {
      localStorage.setItem(SCROLL_KEY, containerRef.current.scrollLeft.toString());
    }
  };

  // Save current FY
  const saveCurrentFY = (index: number) => {
    localStorage.setItem(FY_KEY, index.toString());
  };

  // Restore scroll position on mount
  useEffect(() => {
    const savedScroll = localStorage.getItem(SCROLL_KEY);
    if (savedScroll && containerRef.current) {
      setTimeout(() => {
        containerRef.current!.scrollLeft = parseInt(savedScroll);
        setScrollLeft(parseInt(savedScroll));
      }, 100);
    }
  }, []);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (container) {
      const scrollAmount = 200;
      const newScrollLeft = direction === 'left' 
        ? Math.max(0, scrollLeft - scrollAmount)
        : Math.min(container.scrollWidth - container.clientWidth, scrollLeft + scrollAmount);
      container.scrollTo({ left: newScrollLeft, behavior: 'smooth' });
      setScrollLeft(newScrollLeft);
      saveScrollPosition();
    }
  };

  // Handle manual scroll
  const handleContainerScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const newScrollLeft = e.currentTarget.scrollLeft;
    setScrollLeft(newScrollLeft);
    saveScrollPosition();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      {showHeader && (
        <div className="bg-slate-900/90 backdrop-blur-xl shadow-2xl border-b border-white/10">
          <div className="max-w-[98%] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl blur-lg opacity-75"></div>
                  <div className="relative bg-gradient-to-br from-cyan-400 to-blue-600 p-3 rounded-2xl shadow-xl">
                    <Calendar className="w-7 h-7 text-white" />
                  </div>
                </div>
                <div>
                  <h1 className="text-2xl text-white tracking-tight">
                    Dry ESS Critical Event
                  </h1>
                </div>
              </div>
              <div className="flex gap-3 items-center">
                {/* Fiscal Year Selector */}
                <div className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-1.5">
                  <span className="text-xs text-slate-400">Fiscal Year:</span>
                  <select
                    value={currentFYIndex}
                    onChange={(e) => {
                      const newIndex = parseInt(e.target.value);
                      setCurrentFYIndex(newIndex);
                      saveCurrentFY(newIndex);
                    }}
                    className="bg-slate-700 text-white text-sm rounded px-2 py-1 outline-none focus:ring-2 focus:ring-violet-500"
                  >
                    {data.fiscalYears.map((fy, index) => (
                      <option key={index} value={index}>{fy.name}</option>
                    ))}
                  </select>
                  <Button 
                    onClick={() => setFiscalYearDialog(true)} 
                    className="bg-violet-600 hover:bg-violet-700 text-white p-1 h-6 w-6 rounded"
                    size="sm"
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  {data.fiscalYears.length > 1 && (
                    <Button 
                      onClick={() => deleteFiscalYear(currentFYIndex)}
                      className="bg-red-600 hover:bg-red-700 text-white p-1 h-6 w-6 rounded"
                      size="sm"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                {/* Add Row Button */}
                <Button 
                  onClick={() => setAddRowDialog(true)} 
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/50 border-0" 
                  size="sm"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加工厂
                </Button>
                {/* Export Excel Button */}
                <Button 
                  onClick={exportToExcel} 
                  className="bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 shadow-lg shadow-blue-500/50 border-0" 
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  导出Excel
                </Button>
                <Button 
                  onClick={onLogout} 
                  variant="outline" 
                  size="sm" 
                  className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white border-0"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  退出
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline Route View */}
      <div className="max-w-[98%] mx-auto px-6 pb-4">
        <div className="bg-gradient-to-br from-white via-slate-50 to-white backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/40 relative">
          {/* Timeline Container */}
          <div className="p-4 relative">
            {/* Left Scroll Button */}
            <button
              onClick={() => handleScroll('left')}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-slate-800/90 hover:bg-slate-700 text-white p-2 rounded-full shadow-lg transition-all hover:scale-110"
              title="向左滑动"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Right Scroll Button */}
            <button
              onClick={() => handleScroll('right')}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-slate-800/90 hover:bg-slate-700 text-white p-2 rounded-full shadow-lg transition-all hover:scale-110"
              title="向右滑动"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            {/* Timeline - Unified Layout */}
            <div 
              ref={containerRef}
              id="timeline-container"
              className="overflow-x-auto pb-4"
              onScroll={handleContainerScroll}
            >
              <div className="min-w-max pr-6">
                {/* Unified Grid Container - Fixed 12 months */}
                <div className="grid" style={{ gridTemplateColumns: '96px repeat(12, 110px)' }}>
                  {/* Empty corner cell */}
                  <div className="bg-gradient-to-br from-white via-slate-50 to-white z-20 sticky left-0"></div>
                  
                  {/* Time Axis Header - Fixed month names */}
                  {['Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, colIndex) => (
                    <div
                      key={colIndex}
                      className="flex flex-col items-center justify-center h-8"
                    >
                      <div className="px-2 py-1 text-center">
                        <div className="text-xs font-semibold text-slate-700">{month}</div>
                      </div>
                    </div>
                  ))}

                  {/* Factory Rows */}
                  {data.rows.map((row, rowIndex) => (
                    <React.Fragment key={rowIndex}>
                      {/* Factory Name - Sticky Left Column */}
                      <div 
                        className="bg-gradient-to-br from-white via-slate-50 to-white z-20 sticky left-0 flex items-start pt-1 px-1 relative group"
                      >
                        {/* Route line - spans full row */}
                        <div 
                          className="absolute left-0 right-[-100vw] top-4 h-0.5 z-0 pointer-events-none"
                          style={{ 
                            background: `linear-gradient(90deg, ${ROUTE_COLOR}40, ${ROUTE_COLOR})`
                          }}
                        ></div>
                        
                        {/* Factory Name - Editable on double click */}
                        {editingRowName?.index === rowIndex ? (
                          <div className="flex items-center gap-1 z-10">
                            <input
                              type="text"
                              value={editingRowName.name}
                              onChange={handleRowNameChange}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRowNameConfirm();
                                if (e.key === 'Escape') handleRowNameCancel();
                              }}
                              onBlur={handleRowNameConfirm}
                              className="text-xs font-bold px-2 py-1 rounded-md shadow-md outline-none w-20"
                              style={{ background: ROUTE_COLOR, color: 'white' }}
                              autoFocus
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <div 
                              onDoubleClick={() => handleRowNameDoubleClick(rowIndex, row)}
                              className="text-xs font-bold text-white px-2 py-1 rounded-md shadow-md relative z-10 cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ background: ROUTE_COLOR }}
                              title="双击编辑"
                            >
                              {row}
                            </div>
                            {/* Delete row button - show on hover */}
                            {data.rows.length > 1 && (
                              <button
                                onClick={() => showDeleteRowConfirm(rowIndex, row)}
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                                title="删除工厂"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {/* Event Cells - Fixed 12 months */}
                      {Array.from({ length: 12 }).map((_, colIndex) => {
                        const key = `${rowIndex}-${colIndex}`;
                        const cellData = cells[key];
                        const hasEvent = cellData && cellData.value.trim();

                        return (
                          <div
                            key={colIndex}
                            className={`relative px-0.5 group ${hasEvent ? '' : 'hover:bg-slate-50/50'}`}
                          >
                            {/* Full height clickable area */}
                            <div
                              onClick={() => handleCellClick(rowIndex, colIndex)}
                              className="w-full min-h-[60px] cursor-pointer"
                            >
                              {/* Event Dot - only show if has content */}
                              {hasEvent && (
                                <div className="flex justify-center pt-1">
                                  <div className={`w-2.5 h-2.5 rounded-full transform transition-all shadow-sm ${
                                    cellData.status === 'completed'
                                      ? 'bg-emerald-500 ring-1 ring-emerald-300'
                                      : 'bg-blue-500 ring-1 ring-blue-300'
                                  }`}></div>
                                </div>
                              )}
                              
                              {/* Event Content - fills cell width with word wrap */}
                              {hasEvent && (
                                <div className={`mt-1 mx-0.5 px-1.5 py-1 rounded text-[10px] leading-snug ${
                                  cellData.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {cellData.value.split('\n').map((line, i) => (
                                    <div key={i} className="break-all">{line}</div>
                                  ))}
                                </div>
                              )}
                            </div>
                            
                            {/* Status Toggle Button - Show on hover */}
                            {hasEvent && (
                              <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCellStatus(rowIndex, colIndex);
                                  }}
                                  className={`p-1 rounded-full shadow-md transition-all hover:scale-110 ${
                                    cellData.status === 'completed'
                                      ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                      : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                  }`}
                                  title={cellData.status === 'completed' ? '标记为进行中' : '标记为已完成'}
                                >
                                  {cellData.status === 'completed' ? (
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="mt-6 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl shadow-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg text-white mb-3">💡 时间轴说明</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-white/80">
                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-blue-500 ring-2 ring-blue-300"></div>
                  <span>蓝色圆点：进行中事件</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-300"></div>
                  <span>绿色圆点：已完成事件</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                  <span className="text-lg">→</span>
                  <span>时间轴：从左到右依次排列</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                  <div className="w-3 h-0.5 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                  <span>彩色航线：不同工厂</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg md:col-span-2">
                  <span>�</span>
                  <span>事件内容：直接显示在时间轴下方</span>
                </div>
                <div className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg md:col-span-2">
                  <span>��️</span>
                  <span>点击事件卡片可编辑，双击月份标题修改日期</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Cell Dialog */}
      {editingCell && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-4">
              <h3 className="text-lg font-bold text-white">
                ✏️ 编辑事件
              </h3>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">工厂</label>
                  <div 
                    className="mt-1 px-3 py-2 rounded-lg text-white font-medium"
                    style={{ background: ROUTE_COLOR }}
                  >
                    {data.rows[editingCell.rowIndex]}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">时间</label>
                  <div className="mt-1 px-3 py-2 bg-slate-100 rounded-lg text-slate-800">
                    {columns[editingCell.colIndex]}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-600">事件内容</label>
                  <textarea
                    value={tempValue}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                    rows={5}
                    autoFocus
                    placeholder="输入事件内容..."
                  />
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <Button
                  onClick={saveData}
                  className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white"
                >
                  <Save className="w-4 h-4 mr-2" />
                  保存
                </Button>
                <Button
                  onClick={() => {
                    if (editingCell) {
                      toggleCellStatus(editingCell.rowIndex, editingCell.colIndex);
                      setEditingCell(null);
                      setTempValue('');
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  切换状态
                </Button>
                <Button
                  onClick={() => {
                    if (editingCell) {
                      deleteEvent(editingCell.rowIndex, editingCell.colIndex);
                      setEditingCell(null);
                      setTempValue('');
                    }
                  }}
                  className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  删除
                </Button>
                <Button
                  onClick={() => {
                    setEditingCell(null);
                    setTempValue('');
                  }}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="w-4 h-4 mr-2" />
                  取消
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Row Dialog */}
      <div className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm ${!addRowDialog ? 'hidden' : ''}`}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">添加工厂</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">工厂名称</label>
              <input
                type="text"
                value={newRowName}
                onChange={(e) => setNewRowName(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：LYLK"
                autoFocus
              />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button onClick={addRow} disabled={!newRowName.trim()} className="flex-1">
              添加
            </Button>
            <Button onClick={() => setAddRowDialog(false)} variant="outline" className="flex-1">
              取消
            </Button>
          </div>
        </div>
      </div>

      {/* Delete Row Confirm Dialog */}
      <div className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm ${!deleteRowConfirm ? 'hidden' : ''}`}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">确认删除</h3>
          <p className="text-slate-600 mb-6">
            确定要删除工厂 <span className="font-semibold text-slate-800">{deleteRowConfirm?.name}</span> 吗？此操作不可恢复。
          </p>
          <div className="mt-6 flex gap-3">
            <Button 
              onClick={() => deleteRowConfirm && deleteRow(deleteRowConfirm.index)} 
              className="flex-1 bg-red-500 hover:bg-red-600"
            >
              删除
            </Button>
            <Button onClick={() => setDeleteRowConfirm(null)} variant="outline" className="flex-1">
              取消
            </Button>
          </div>
        </div>
      </div>

      {/* Add Column Dialog */}
      <div className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm ${!addColumnDialog ? 'hidden' : ''}`}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">添加月份</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">月份名称</label>
              <input
                type="text"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：Jul"
                autoFocus
              />
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button onClick={addColumn} disabled={!newColumnName.trim()} className="flex-1">
              添加
            </Button>
            <Button onClick={() => setAddColumnDialog(false)} variant="outline" className="flex-1">
              取消
            </Button>
          </div>
        </div>
      </div>

      {/* Fiscal Year Dialog */}
      <div className={`fixed inset-0 z-[10000] flex items-center justify-center bg-black/50 backdrop-blur-sm ${!fiscalYearDialog ? 'hidden' : ''}`}>
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-6">
          <h3 className="text-lg font-bold text-slate-800 mb-4">添加 Fiscal Year</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-600">Fiscal Year 名称</label>
              <input
                type="text"
                value={newFiscalYear}
                onChange={(e) => setNewFiscalYear(e.target.value.toUpperCase())}
                className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="例如：FY2526"
                autoFocus
              />
              <p className="mt-2 text-xs text-slate-500">
                格式：FY2526 表示 2025年7月 - 2026年6月
              </p>
            </div>
          </div>
          <div className="mt-6 flex gap-3">
            <Button onClick={addFiscalYear} disabled={!newFiscalYear.trim()} className="flex-1">
              添加
            </Button>
            <Button onClick={() => {setFiscalYearDialog(false); setNewFiscalYear('');}} variant="outline" className="flex-1">
              取消
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
