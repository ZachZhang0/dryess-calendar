import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { LogOut, Plus, Trash2, Save, Calendar, Edit3, Check, X, MoreVertical, Palette, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import { Label } from './ui/label';

interface CellData {
  id: string;
  value: string;
  status?: 'completed' | 'pending';
}

interface CalendarData {
  rows: string[];
  columns: string[];
  cells: { [key: string]: { value: string; status?: 'completed' | 'pending' } };
  columnWidths: { [key: number]: number };
  rowHeights: { [key: number]: number };
}

interface EventCalendarProps {
  onLogout: () => void;
  onSwitchView?: () => void;
}

export function EventCalendar({ onLogout, onSwitchView }: EventCalendarProps) {
  const [data, setData] = useState<CalendarData>({
    rows: ['Common', 'TSL', 'NSLK', 'SK', 'CS', 'LYLK'],
    columns: ['Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    cells: {
      '0-0': { value: 'BU SDES', status: 'pending' },
      '0-1': { value: 'ESS SDES-8/8', status: 'pending' },
      '0-2': { value: 'NSS WS-9/15-19', status: 'pending' },
      '0-3': { value: 'ESS QBU 10/31\nPoe review-10/28', status: 'pending' },
      '0-4': { value: '洗涤行业展会\n11/12', status: 'pending' },
      '0-5': { value: 'TRL Workshop\n12/7,8,9\nJXX benchmark visit\n12/18', status: 'pending' },
      '0-6': { value: 'ESS Offsite Meeting\n1/29\nSK visit CD 1/20\nPoe review-1/28', status: 'pending' },
      '0-8': { value: 'Poe QBU 3/2\nT&W Workshop-\n3/20\nNSS WS-3/31 & 4/1', status: 'pending' },
      '0-9': { value: 'ESS QBU\n4/24', status: 'pending' },
      '0-11': { value: 'PDD 6/11&12', status: 'pending' },
      '1-0': { value: 'Vaule\nCreation WS', status: 'pending' },
      '1-3': { value: 'TSL-POSM test\n10/20,21,22', status: 'pending' },
      '1-6': { value: 'Poe visit-1/13', status: 'pending' },
      '2-4': { value: 'Seema\nBD-11/10', status: 'pending' },
      '2-6': { value: 'Poe visit-tbd', status: 'pending' },
      '2-8': { value: 'Value Creation WS\n时间 TBD', status: 'pending' },
      '3-1': { value: 'Charles\nvisit-8/26', status: 'pending' },
      '3-4': { value: 'Charles\nvisit-11/25', status: 'pending' },
      '3-6': { value: 'SK QAC-1/7-1/9\nValue Creation WS 1/15', status: 'pending' },
      '3-8': { value: 'Charles Visit 3/24', status: 'pending' },
      '3-9': { value: 'Poe Visit-TBD', status: 'pending' },
      '4-1': { value: 'Poe visit-8/12', status: 'pending' },
      '4-4': { value: 'POSS\nRenew-11/13,14', status: 'pending' },
      '4-11': { value: 'Poe Visit-TBD', status: 'pending' },
    },
    columnWidths: {},
    rowHeights: {}
  });

  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [addRowDialog, setAddRowDialog] = useState(false);
  const [addColumnDialog, setAddColumnDialog] = useState(false);
  const [newRowName, setNewRowName] = useState('');
  const [newColumnName, setNewColumnName] = useState('');
  const [editingHeader, setEditingHeader] = useState<{ type: 'row' | 'column'; index: number } | null>(null);
  const [tempHeaderValue, setTempHeaderValue] = useState('');
  const [resizing, setResizing] = useState<{ type: 'col' | 'row'; index: number; startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
  const [editingColumnDate, setEditingColumnDate] = useState<{ index: number; year: number; month: number } | null>(null);
  const [pickerView, setPickerView] = useState<'year' | 'month' | null>(null);
  const [tempYear, setTempYear] = useState<number>(2025);
  const [tempMonth, setTempMonth] = useState<number>(1);
  const [tableScale, setTableScale] = useState<{ width: number; height: number }>({ width: 100, height: 100 });
  const [resizingTable, setResizingTable] = useState<{ type: 'width' | 'height'; startX: number; startY: number; startValue: number } | null>(null);
  const [showHeader, setShowHeader] = useState(true);
  const [manualInput, setManualInput] = useState<{ year: string; month: string }>({ year: '', month: '' });
  const [editingYear, setEditingYear] = useState<string>('');
  const [editingMonth, setEditingMonth] = useState<string>('');
  
  // Calculate optimal cell dimensions for single-screen display
  const calculateOptimalDimensions = () => {
    const availableWidth = window.innerWidth * 0.95; // 95% of screen width
    const availableHeight = window.innerHeight - 280; // Subtract header and toolbar
    
    const rowCount = data.rows.length;
    const colCount = data.columns.length;
    
    // Calculate optimal cell width (distribute width evenly across columns)
    const optimalCellWidth = Math.max(120, Math.min(180, (availableWidth - 140) / colCount));
    
    // Calculate optimal cell height (distribute height evenly across rows)
    const optimalCellHeight = Math.max(60, Math.min(100, availableHeight / rowCount));
    
    return { optimalCellWidth, optimalCellHeight };
  };

  // Load data from localStorage on mount
  useEffect(() => {
    const savedData = localStorage.getItem('calendarData');
    if (savedData) {
      try {
        setData(JSON.parse(savedData));
      } catch (e) {
        console.error('Failed to load data:', e);
      }
    } else {
      // Auto-optimize dimensions on first load
      const { optimalCellWidth, optimalCellHeight } = calculateOptimalDimensions();
      const columnWidths: { [key: number]: number } = {};
      const rowHeights: { [key: number]: number } = {};
      
      for (let i = 0; i < 12; i++) {
        columnWidths[i] = optimalCellWidth;
      }
      for (let i = 0; i < 6; i++) {
        rowHeights[i] = optimalCellHeight;
      }
      
      setData(prev => ({
        ...prev,
        columnWidths,
        rowHeights
      }));
    }
  }, []);

  // Auto-save functionality
  useEffect(() => {
    const timer = setTimeout(() => {
      localStorage.setItem('calendarData', JSON.stringify(data));
    }, 1000);
    return () => clearTimeout(timer);
  }, [data]);

  // Handle window resize to optimize table dimensions
  useEffect(() => {
    const handleResize = () => {
      const { optimalCellWidth, optimalCellHeight } = calculateOptimalDimensions();
      const columnWidths: { [key: number]: number } = {};
      const rowHeights: { [key: number]: number } = {};
      
      for (let i = 0; i < data.columns.length; i++) {
        columnWidths[i] = optimalCellWidth;
      }
      for (let i = 0; i < data.rows.length; i++) {
        rowHeights[i] = optimalCellHeight;
      }
      
      setData(prev => ({
        ...prev,
        columnWidths,
        rowHeights
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [data.rows.length, data.columns.length]);

  const saveData = () => {
    localStorage.setItem('calendarData', JSON.stringify(data));
    toast.success('数据已保存', {
      description: '所有更改已成功保存到本地',
    });
  };

  const handleCellClick = (rowIndex: number, colIndex: number) => {
    const key = `${rowIndex}-${colIndex}`;
    setEditingCell(key);
    setTempValue(data.cells[key]?.value || '');
  };

  const handleCellBlur = () => {
    if (editingCell) {
      const newCells = { ...data.cells };
      if (tempValue.trim() === '') {
        delete newCells[editingCell];
      } else {
        newCells[editingCell] = {
          value: tempValue,
          status: newCells[editingCell]?.status || 'pending'
        };
      }
      setData({ ...data, cells: newCells });
      setEditingCell(null);
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
    const newCells = { ...data.cells };
    
    if (!newCells[key]) return;
    
    newCells[key] = {
      ...newCells[key],
      status: newCells[key].status === 'completed' ? 'pending' : 'completed'
    };
    
    setData({ ...data, cells: newCells });
    toast.success(
      newCells[key].status === 'completed' ? '标记为已完成' : '标记为进行中',
      { duration: 2000 }
    );
  };

  const addRow = () => {
    if (newRowName && newRowName.trim()) {
      setData({
        ...data,
        rows: [...data.rows, newRowName.trim()]
      });
      toast.success('已添加新行', {
        description: `新增站点：${newRowName.trim()}`,
      });
      setNewRowName('');
      setAddRowDialog(false);
    }
  };

  const addColumn = () => {
    if (newColumnName && newColumnName.trim()) {
      setData({
        ...data,
        columns: [...data.columns, newColumnName.trim()]
      });
      toast.success('已添加新列', {
        description: `新增月份：${newColumnName.trim()}`,
      });
      setNewColumnName('');
      setAddColumnDialog(false);
    }
  };

  const deleteRow = (index: number) => {
    if (confirm('确定要删除这一行吗？')) {
      const newRows = data.rows.filter((_, i) => i !== index);
      const newCells = { ...data.cells };
      
      Object.keys(newCells).forEach(key => {
        const [rowIdx] = key.split('-').map(Number);
        if (rowIdx === index) {
          delete newCells[key];
        } else if (rowIdx > index) {
          const [, colIdx] = key.split('-').map(Number);
          newCells[`${rowIdx - 1}-${colIdx}`] = newCells[key];
          delete newCells[key];
        }
      });

      setData({ ...data, rows: newRows, cells: newCells });
      toast.success('已删除行');
    }
  };

  const deleteColumn = (index: number) => {
    if (confirm('确定要删除这一列吗？')) {
      const newColumns = data.columns.filter((_, i) => i !== index);
      const newCells = { ...data.cells };
      
      Object.keys(newCells).forEach(key => {
        const [rowIdx, colIdx] = key.split('-').map(Number);
        if (colIdx === index) {
          delete newCells[key];
        } else if (colIdx > index) {
          newCells[`${rowIdx}-${colIdx - 1}`] = newCells[key];
          delete newCells[key];
        }
      });

      setData({ ...data, columns: newColumns, cells: newCells });
      toast.success('已删除列');
    }
  };

  const parseColumnDate = (dateStr: string): { year: number; month: number } | null => {
    const match = dateStr.match(/(\d{4}) 年 (\d{1,2}) 月/);
    if (match) {
      return { year: parseInt(match[1]), month: parseInt(match[2]) };
    }
    const monthMap: { [key: string]: number } = {
      'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
      'Jul': 7, 'Aug': 8, 'Sept': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
    };
    if (monthMap[dateStr]) {
      return { year: 2025, month: monthMap[dateStr] };
    }
    return null;
  };

  const formatDate = (year: number, month: number): string => {
    return `${year}年${month}月`;
  };

  const handleHeaderDoubleClick = (type: 'row' | 'column', index: number, currentValue: string) => {
    if (type === 'column') {
      const monthMap: { [key: string]: number } = {
        'Jan': 1, 'Feb': 2, 'Mar': 3, 'Apr': 4, 'May': 5, 'Jun': 6,
        'Jul': 7, 'Aug': 8, 'Sept': 9, 'Oct': 10, 'Nov': 11, 'Dec': 12
      };
      
      let year = 2025;
      let month = 1;
      
      const parsed = parseColumnDate(currentValue);
      if (parsed) {
        year = parsed.year;
        month = parsed.month;
      } else if (monthMap[currentValue]) {
        month = monthMap[currentValue];
      }
      
      setTempYear(year);
      setTempMonth(month);
      setEditingYear(year.toString());
      setEditingMonth(month.toString());
      setManualInput({ year: year.toString(), month: month.toString() });
      setEditingColumnDate({ index, year, month });
      setPickerView(null);
    } else {
      setEditingHeader({ type, index });
      setTempHeaderValue(currentValue);
    }
  };

  const handleYearInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEditingYear(val);
    if (val === '') {
      return;
    }
    const num = parseInt(val);
    if (!isNaN(num) && num >= 2000 && num <= 2100) {
      setTempYear(num);
    }
  };

  const handleMonthInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEditingMonth(val);
    if (val === '') {
      return;
    }
    const num = parseInt(val);
    if (!isNaN(num) && num >= 1 && num <= 12) {
      setTempMonth(num);
    }
  };

  const handleColumnDateConfirm = () => {
    if (editingColumnDate && tempYear && tempMonth) {
      const newColumns = [...data.columns];
      newColumns[editingColumnDate.index] = formatDate(tempYear, tempMonth);
      setData({ ...data, columns: newColumns });
      setEditingColumnDate(null);
      toast.success('日期已更新', {
        description: formatDate(tempYear, tempMonth),
      });
    }
  };

  const handleManualYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setManualInput(prev => ({ ...prev, year: value }));
    const year = parseInt(value);
    if (!isNaN(year) && year >= 2000 && year <= 2100) {
      setTempYear(year);
    }
  };

  const handleManualMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setManualInput(prev => ({ ...prev, month: value }));
    const month = parseInt(value);
    if (!isNaN(month) && month >= 1 && month <= 12) {
      setTempMonth(month);
    }
  };

  const handleColumnDateCancel = () => {
    setEditingColumnDate(null);
  };

  const handleYearChange = (delta: number) => {
    setTempYear(prev => Math.max(2000, Math.min(2100, prev + delta)));
  };

  const handleMonthChange = (delta: number) => {
    setTempMonth(prev => {
      let newMonth = prev + delta;
      if (newMonth > 12) {
        setTempYear(prev => prev + 1);
        return 1;
      } else if (newMonth < 1) {
        setTempYear(prev => prev - 1);
        return 12;
      }
      return newMonth;
    });
  };

  const handleHeaderBlur = () => {
    if (editingHeader && tempHeaderValue.trim()) {
      if (editingHeader.type === 'column') {
        const newColumns = [...data.columns];
        newColumns[editingHeader.index] = tempHeaderValue.trim();
        setData({ ...data, columns: newColumns });
      } else {
        const newRows = [...data.rows];
        newRows[editingHeader.index] = tempHeaderValue.trim();
        setData({ ...data, rows: newRows });
      }
      setEditingHeader(null);
    }
  };

  const handleHeaderKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleHeaderBlur();
    } else if (e.key === 'Escape') {
      setEditingHeader(null);
    }
  };

  const startResize = (e: React.MouseEvent, type: 'col' | 'row', index: number, startWidth: number, startHeight: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({
      type,
      index,
      startX: e.clientX,
      startY: e.clientY,
      startWidth,
      startHeight
    });
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!resizing) return;

    if (resizing.type === 'col') {
      const deltaX = e.clientX - resizing.startX;
      const newWidth = Math.max(100, resizing.startWidth + deltaX);
      const newColumnWidths = { ...data.columnWidths };
      newColumnWidths[resizing.index] = newWidth;
      setData(prev => ({ ...prev, columnWidths: newColumnWidths }));
    } else {
      const deltaY = e.clientY - resizing.startY;
      const newHeight = Math.max(60, resizing.startHeight + deltaY);
      const newRowHeights = { ...data.rowHeights };
      newRowHeights[resizing.index] = newHeight;
      setData(prev => ({ ...prev, rowHeights: newHeights }));
    }
  };

  const handleMouseUp = () => {
    setResizing(null);
    setResizingTable(null);
  };

  useEffect(() => {
    if (resizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [resizing]);

  const startTableResize = (e: React.MouseEvent, type: 'width' | 'height', startValue: number) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingTable({
      type,
      startX: e.clientX,
      startY: e.clientY,
      startValue
    });
  };

  const handleTableMouseMove = (e: MouseEvent) => {
    if (!resizingTable) return;

    if (resizingTable.type === 'width') {
      const deltaX = e.clientX - resizingTable.startX;
      const deltaPercent = (deltaX / window.innerWidth) * 100;
      const newWidth = Math.max(50, Math.min(100, resizingTable.startValue + deltaPercent));
      setTableScale(prev => ({ ...prev, width: newWidth }));
    } else {
      const deltaY = e.clientY - resizingTable.startY;
      const deltaPercent = (deltaY / window.innerHeight) * 100;
      const newHeight = Math.max(50, Math.min(150, resizingTable.startValue + deltaPercent));
      setTableScale(prev => ({ ...prev, height: newHeight }));
    }
  };

  const handleTableMouseUp = () => {
    setResizingTable(null);
  };

  useEffect(() => {
    if (resizingTable) {
      window.addEventListener('mousemove', handleTableMouseMove);
      window.addEventListener('mouseup', handleTableMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleTableMouseMove);
        window.removeEventListener('mouseup', handleTableMouseUp);
      };
    }
  }, [resizingTable]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      {showHeader && (
        <div className="bg-slate-900/90 backdrop-blur-xl shadow-2xl border-b border-white/10 sticky top-0 z-30">
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
                  <p className="text-sm text-cyan-300/80">部门大事件日历系统</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Button 
                  onClick={() => setShowHeader(!showHeader)} 
                  className="bg-gradient-to-r from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 shadow-lg shadow-slate-500/50 border-0" 
                  size="sm"
                  title={showHeader ? "隐藏标题" : "显示标题"}
                >
                  {showHeader ? (
                    <>
                      <EyeOff className="w-4 h-4 mr-2" />
                      隐藏标题
                    </>
                  ) : (
                    <>
                      <Eye className="w-4 h-4 mr-2" />
                      显示标题
                    </>
                  )}
                </Button>
                <Button 
                  onClick={saveData} 
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-lg shadow-emerald-500/50 border-0" 
                  size="sm"
                >
                  <Save className="w-4 h-4 mr-2" />
                  保存数据
                </Button>
                <Button 
                  onClick={onLogout} 
                  variant="outline" 
                  size="sm" 
                  className="border-white/20 text-white hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  退出
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="max-w-[98%] mx-auto px-6 py-4">
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl p-4 border border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex gap-3">
              <Button 
                onClick={() => setAddRowDialog(true)} 
                size="sm" 
                className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white shadow-lg shadow-purple-500/50 border-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加行
              </Button>
              <Button 
                onClick={() => setAddColumnDialog(true)} 
                size="sm" 
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-lg shadow-amber-500/50 border-0"
              >
                <Plus className="w-4 h-4 mr-2" />
                添加列
              </Button>
            </div>
            <div className="text-sm text-white/80 flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                <span>已完成</span>
              </div>
              <div className="w-px h-4 bg-white/20"></div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                <span>进行中</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Column Date Editor - Fixed Position Overlay (Outside Table Container) */}
      {editingColumnDate && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          <div className="absolute inset-0 pointer-events-auto">
            <div className="h-full w-full bg-gradient-to-br from-blue-600/10 via-indigo-700/10 to-purple-800/10 backdrop-blur-sm">
              {/* Editor Panel */}
              <div className="absolute top-0 h-full shadow-2xl" style={{
                left: `${120 + (editingColumnDate.index * (data.columnWidths[editingColumnDate.index] || 150))}px`,
                width: `${data.columnWidths[editingColumnDate.index] || 150}px`
              }}>
                <div className="h-full bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 backdrop-blur-md p-2 border border-white/40">
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-end gap-0.5 mb-1 pb-1 border-b border-white/30">
                      <button
                        onClick={handleColumnDateConfirm}
                        className="px-1.5 py-0.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded text-[10px] transition-all shadow-lg hover:shadow-emerald-500/50 font-medium flex items-center gap-0.5 z-[10001] relative"
                        title="确认"
                      >
                        <Check className="w-2.5 h-2.5" />
                        确认
                      </button>
                      <button
                        onClick={handleColumnDateCancel}
                        className="px-1.5 py-0.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded text-[10px] transition-all shadow-lg hover:shadow-red-500/50 font-medium flex items-center gap-0.5 z-[10001] relative"
                        title="取消"
                      >
                        <X className="w-2.5 h-2.5" />
                        取消
                      </button>
                    </div>
                    
                    {/* Year/Month Input Row */}
                    <div className="flex items-center justify-center gap-2 my-2">
                      <div className="relative inline-block">
                        <input
                          type="text"
                          value={editingYear}
                          onChange={handleYearInputChange}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                              e.stopPropagation();
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPickerView(pickerView === 'year' ? null : 'year');
                          }}
                          className="w-24 h-8 pl-2 pr-5 bg-slate-800 border-2 border-white/30 rounded-lg text-white text-sm text-center focus:outline-none focus:border-blue-500 hover:bg-slate-700 transition-all"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 text-xs pointer-events-none font-medium">年</span>
                        {pickerView === 'year' && (
                          <div className="absolute top-full left-0 mt-1 z-[100] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-md rounded-xl p-2 border border-white/30 shadow-2xl min-w-[200px]">
                            <div className="grid grid-cols-3 gap-1.5">
                              {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(year => (
                                <button
                                  key={year}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingYear(year.toString());
                                    setTempYear(year);
                                    setPickerView(null);
                                  }}
                                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105 shadow-md ${
                                    tempYear === year
                                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/50'
                                      : 'bg-slate-800/80 hover:bg-slate-700/80 text-white/90'
                                  }`}
                                >
                                  {year}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="relative inline-block">
                        <input
                          type="text"
                          value={editingMonth}
                          onChange={handleMonthInputChange}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' || e.key === 'Delete' || e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
                              e.stopPropagation();
                            }
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setPickerView(pickerView === 'month' ? null : 'month');
                          }}
                          className="w-20 h-8 pl-2 pr-5 bg-slate-800 border-2 border-white/30 rounded-lg text-white text-sm text-center focus:outline-none focus:border-blue-500 hover:bg-slate-700 transition-all"
                        />
                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-white/70 text-xs pointer-events-none font-medium">月</span>
                        {pickerView === 'month' && (
                          <div className="absolute top-full left-0 mt-1 z-[100] bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 backdrop-blur-md rounded-xl p-2 border border-white/30 shadow-2xl min-w-[220px]">
                            <div className="grid grid-cols-4 gap-1.5">
                              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => (
                                <button
                                  key={month}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingMonth(month.toString());
                                    setTempMonth(month);
                                    setPickerView(null);
                                  }}
                                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-all duration-200 hover:scale-105 shadow-md ${
                                    tempMonth === month
                                      ? 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-blue-500/50'
                                      : 'bg-slate-800/80 hover:bg-slate-700/80 text-white/90'
                                  }`}
                                >
                                  {month}月
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Calendar Table */}
      <div className="max-w-[98%] mx-auto px-6 pb-8 relative">
        <div 
          className="bg-gradient-to-br from-white via-slate-50 to-white backdrop-blur-xl rounded-3xl shadow-[0_8px_32px_rgba(0,0,0,0.18),0_2px_8px_rgba(0,0,0,0.1)] overflow-hidden border border-white/40 relative"
          style={{ 
            width: '100%',
            transition: resizingTable ? 'none' : 'all 0.2s ease-out'
          }}
        >
          <div 
            className="overflow-auto custom-scrollbar"
          >
            <table className="w-full border-collapse">
              <thead className="sticky top-0 z-20">
                <tr>
                  <th className="bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 text-white p-3 border-r border-slate-600/50 sticky left-0 z-20 shadow-lg" style={{ minWidth: '120px', width: '120px' }}>
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-semibold tracking-wide text-white/95 drop-shadow-md">Site</span>
                    </div>
                  </th>
                  {data.columns.map((col, colIndex) => {
                    const width = data.columnWidths[colIndex] || 150;
                    const isEditingDate = editingColumnDate?.index === colIndex;
                    
                    return (
                      <th
                        key={colIndex}
                        className="bg-gradient-to-br from-indigo-600 via-blue-700 to-indigo-800 text-white p-3 border-r border-blue-500/30 relative group"
                        style={{ minWidth: `${width}px`, width: `${width}px` }}
                      >
                        <div className="flex items-center justify-center gap-2">
                          <span 
                            className="text-xs font-semibold cursor-pointer hover:text-white/90 transition-colors duration-200 drop-shadow-sm"
                            onDoubleClick={() => handleHeaderDoubleClick('column', colIndex, col)}
                            title="双击编辑年月"
                          >
                            {col}
                          </span>
                          <button
                            onClick={() => deleteColumn(colIndex)}
                            className="opacity-0 group-hover:opacity-100 transition-all duration-200 absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-1.5 rounded-lg shadow-lg hover:shadow-red-500/50 hover:scale-110"
                            title="删除此列"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                        <div
                          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize bg-gradient-to-b from-white/20 to-transparent hover:from-blue-400 hover:to-blue-400/60 transition-all opacity-0 group-hover:opacity-100"
                          onMouseDown={(e) => startResize(e, 'col', colIndex, width, 0)}
                        />
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, rowIndex) => {
                  const rowHeight = data.rowHeights[rowIndex] || 80;
                  return (
                    <tr key={rowIndex} className="group hover:bg-gradient-to-r hover:from-blue-50/60 hover:to-indigo-50/40 transition-all duration-200">
                      <td className="bg-gradient-to-r from-slate-700 via-slate-800 to-slate-900 text-white p-2 border-r border-slate-600/50 border-b border-slate-200/60 sticky left-0 z-10 shadow-md">
                        <div className="flex items-center justify-between">
                          {editingHeader?.type === 'row' && editingHeader.index === rowIndex ? (
                            <input
                              value={tempHeaderValue}
                              onChange={(e) => setTempHeaderValue(e.target.value)}
                              onBlur={handleHeaderBlur}
                              onKeyDown={handleHeaderKeyDown}
                              className="bg-white/90 text-slate-900 px-2 py-1 rounded text-xs w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                              autoFocus
                            />
                          ) : (
                            <span 
                              className="text-xs font-medium tracking-wide cursor-pointer hover:text-blue-300 transition-colors"
                              onDoubleClick={() => handleHeaderDoubleClick('row', rowIndex, row)}
                              title="双击编辑"
                            >
                              {row}
                            </span>
                          )}
                          <button
                            onClick={() => deleteRow(rowIndex)}
                            className="opacity-0 group-hover:opacity-100 transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white p-1.5 rounded-lg shadow-lg hover:shadow-red-500/50 hover:scale-110"
                            title="删除此行"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </td>
                      {data.columns.map((_, colIndex) => {
                        const key = `${rowIndex}-${colIndex}`;
                        const isEditing = editingCell === key;
                        const cellData = data.cells[key];
                        const cellValue = cellData?.value || '';
                        const cellStatus = cellData?.status || 'pending';
                        const hasContent = cellValue.trim().length > 0;

                        return (
                          <td
                            key={colIndex}
                            className="p-1 border-r border-b border-slate-200/60 bg-gradient-to-br from-white via-slate-50/30 to-white hover:bg-gradient-to-br hover:from-blue-50/50 hover:to-indigo-50/30 cursor-pointer transition-all duration-200 relative group"
                            style={{ height: `${rowHeight}px` }}
                          >
                            {isEditing ? (
                              <div className="relative h-full">
                                <textarea
                                  value={tempValue}
                                  onChange={(e) => setTempValue(e.target.value)}
                                  onBlur={handleCellBlur}
                                  onKeyDown={handleCellKeyDown}
                                  className="w-full h-full p-1.5 border-2 border-blue-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent shadow-[0_0_15px_rgba(59,130,246,0.3)] bg-white text-xs resize-none"
                                  autoFocus
                                  placeholder="输入事件内容..."
                                />
                                <div className="absolute -top-8 right-0 flex gap-1 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-xl shadow-2xl p-1 border border-white/20">
                                  <button
                                    onClick={handleCellBlur}
                                    className="p-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-lg text-white transition-all shadow-md hover:shadow-lg hover:scale-105"
                                    title="保存 (Enter)"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingCell(null);
                                      setTempValue('');
                                    }}
                                    className="p-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 rounded-lg text-white transition-all shadow-md hover:shadow-lg hover:scale-105"
                                    title="取消 (Esc)"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="h-full flex items-start">
                                {hasContent ? (
                                  <div className="flex-1 flex items-start gap-1.5 h-full">
                                    <div 
                                      className={`flex-1 p-1.5 rounded-xl transition-all duration-200 h-full overflow-auto shadow-sm hover:shadow-md ${
                                        cellStatus === 'completed'
                                          ? 'bg-gradient-to-br from-emerald-50 via-teal-50/50 to-emerald-50 border-l-4 border-emerald-500'
                                          : 'bg-gradient-to-br from-blue-50 via-indigo-50/50 to-blue-50 border-l-4 border-blue-500'
                                      }`}
                                      onClick={() => handleCellClick(rowIndex, colIndex)}
                                    >
                                      <div className={`text-xs whitespace-pre-wrap break-words leading-tight font-medium ${
                                        cellStatus === 'completed' ? 'text-emerald-900' : 'text-blue-900'
                                      }`}>
                                        {cellValue}
                                      </div>
                                    </div>
                                    <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <button className="opacity-0 group-hover:opacity-100 transition-all duration-200 p-1 hover:bg-gradient-to-r hover:from-slate-100 hover:to-slate-200 rounded-lg">
                                          <MoreVertical className="w-3.5 h-3.5 text-slate-600" />
                                        </button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="w-40 bg-gradient-to-br from-white to-slate-50 border border-white/40 shadow-xl">
                                        <DropdownMenuItem onClick={() => toggleCellStatus(rowIndex, colIndex)} className="hover:bg-blue-50">
                                          <Palette className="w-3.5 h-3.5 mr-2" />
                                          {cellStatus === 'completed' ? '标记为进行中' : '标记为已完成'}
                                        </DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => handleCellClick(rowIndex, colIndex)} className="hover:bg-blue-50">
                                          <Edit3 className="w-3.5 h-3.5 mr-2" />
                                          编辑内容
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                    </DropdownMenu>
                                  </div>
                                ) : (
                                  <div 
                                    className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                                    onClick={() => handleCellClick(rowIndex, colIndex)}
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-blue-400 hover:text-blue-600 transition-colors" />
                                  </div>
                                )}
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          
          {/* Resize Handles */}
          <div 
            className="absolute -right-1 top-0 bottom-0 w-2 cursor-col-resize bg-gradient-to-b from-blue-500/50 to-transparent hover:from-blue-500 hover:to-blue-500/50 rounded-r-lg opacity-0 hover:opacity-100 transition-all z-30"
            onMouseDown={(e) => startTableResize(e, 'width', tableScale.width)}
            title="拖拽调整宽度"
          />
          <div 
            className="absolute left-0 -bottom-1 right-0 h-2 cursor-row-resize bg-gradient-to-r from-blue-500/50 to-transparent hover:from-blue-500 hover:to-blue-500/50 rounded-b-lg opacity-0 hover:opacity-100 transition-all z-30"
            onMouseDown={(e) => startTableResize(e, 'height', tableScale.height)}
            title="拖拽调整高度"
          />
        </div>
        
        {/* Size Display */}
        <div className="mt-3 flex justify-between items-center text-xs text-white/60">
          <span>表格尺寸：{Math.round(tableScale.width)}% × {Math.round(tableScale.height)}%</span>
          <button 
            onClick={() => setTableScale({ width: 100, height: 100 })}
            className="px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
          >
            重置尺寸
          </button>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 10px;
          height: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(241, 245, 249, 0.5);
          border-radius: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, rgba(59, 130, 246, 0.6) 0%, rgba(37, 99, 235, 0.8) 100%);
          border-radius: 8px;
          border: 2px solid rgba(255, 255, 255, 0.3);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, rgba(59, 130, 246, 0.8) 0%, rgba(37, 99, 235, 1) 100%);
        }
        .custom-scrollbar::-webkit-scrollbar-corner {
          background: rgba(241, 245, 249, 0.3);
        }
      `}</style>

      {/* Info Card */}
      <div className="mt-6 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
          <div className="flex items-start gap-4">
            <div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-3 rounded-xl shadow-lg">
              <Edit3 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg text-white mb-3">💡 使用指南</h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-white/80">
                <li className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span>点击隐藏/显示标题栏</span>
                </li>
                <li className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span>表格自动优化适应单屏</span>
                </li>
                <li className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span>点击单元格编辑内容</span>
                </li>
                <li className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span>双击列标题选择年月</span>
                </li>
                <li className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span>双击行标题编辑名称</span>
                </li>
                <li className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span>拖拽列/行边框调整大小</span>
                </li>
                <li className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span>内容过多自动换行显示</span>
                </li>
                <li className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span>点击⋮菜单切换完成状态</span>
                </li>
                <li className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span>悬停行/列标题显示删除按钮</span>
                </li>
                <li className="flex items-center gap-2 bg-white/5 px-3 py-2 rounded-lg">
                  <div className="w-1.5 h-1.5 bg-cyan-400 rounded-full"></div>
                  <span>数据自动保存到本地</span>
                </li>
              </ul>
              <div className="mt-4 p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl">
                <p className="text-sm text-amber-300">
                  ⚠️ <strong>提示：</strong>当前版本数据仅保存在本浏览器中。要实现多设备同步，需要连接数据库。
                </p>
              </div>
            </div>
          </div>
      </div>

      {/* Add Row Dialog */}
      <Dialog open={addRowDialog} onOpenChange={setAddRowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加新行</DialogTitle>
            <DialogDescription>
              输入新站点的名称
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="row-name">站点名称</Label>
              <Input
                id="row-name"
                value={newRowName}
                onChange={(e) => setNewRowName(e.target.value)}
                placeholder="例如：LYLK"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addRow();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddRowDialog(false)}>
              取消
            </Button>
            <Button onClick={addRow} disabled={!newRowName.trim()}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Column Dialog */}
      <Dialog open={addColumnDialog} onOpenChange={setAddColumnDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>添加新列</DialogTitle>
            <DialogDescription>
              输入新月份的名称
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="column-name">月份名称</Label>
              <Input
                id="column-name"
                value={newColumnName}
                onChange={(e) => setNewColumnName(e.target.value)}
                placeholder="例如：Jul"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    addColumn();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddColumnDialog(false)}>
              取消
            </Button>
            <Button onClick={addColumn} disabled={!newColumnName.trim()}>
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
