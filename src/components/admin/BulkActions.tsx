import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChevronDown, Trash2, Eye, EyeOff, CheckSquare, Square } from 'lucide-react';

interface BulkActionsProps {
  selectedIds: string[];
  totalItems: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkDelete: (ids: string[]) => Promise<void>;
  onBulkActivate?: (ids: string[]) => Promise<void>;
  onBulkDeactivate?: (ids: string[]) => Promise<void>;
  onBulkPublish?: (ids: string[]) => Promise<void>;
  onBulkUnpublish?: (ids: string[]) => Promise<void>;
  entityName?: string;
}

export function BulkActions({
  selectedIds,
  totalItems,
  onSelectAll,
  onDeselectAll,
  onBulkDelete,
  onBulkActivate,
  onBulkDeactivate,
  onBulkPublish,
  onBulkUnpublish,
  entityName = 'item',
}: BulkActionsProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const hasSelection = selectedIds.length > 0;
  const allSelected = selectedIds.length === totalItems && totalItems > 0;

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      await onBulkDelete(selectedIds);
      setDeleteDialogOpen(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkAction = async (action: (ids: string[]) => Promise<void>) => {
    setIsProcessing(true);
    try {
      await action(selectedIds);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!hasSelection) {
    return (
      <Button
        variant="outline"
        size="sm"
        onClick={onSelectAll}
        className="gap-2"
      >
        <Square className="h-4 w-4" />
        Pilih Semua
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={allSelected ? onDeselectAll : onSelectAll}
        className="gap-2"
      >
        {allSelected ? (
          <>
            <CheckSquare className="h-4 w-4" />
            Batal Pilih
          </>
        ) : (
          <>
            <Square className="h-4 w-4" />
            Pilih Semua
          </>
        )}
      </Button>

      <span className="text-sm text-muted-foreground">
        {selectedIds.length} dipilih
      </span>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary" size="sm" className="gap-2" disabled={isProcessing}>
            Aksi Massal
            <ChevronDown className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {onBulkActivate && (
            <DropdownMenuItem onClick={() => handleBulkAction(onBulkActivate)}>
              <Eye className="mr-2 h-4 w-4" />
              Aktifkan
            </DropdownMenuItem>
          )}
          {onBulkDeactivate && (
            <DropdownMenuItem onClick={() => handleBulkAction(onBulkDeactivate)}>
              <EyeOff className="mr-2 h-4 w-4" />
              Nonaktifkan
            </DropdownMenuItem>
          )}
          {onBulkPublish && (
            <DropdownMenuItem onClick={() => handleBulkAction(onBulkPublish)}>
              <Eye className="mr-2 h-4 w-4" />
              Publikasikan
            </DropdownMenuItem>
          )}
          {onBulkUnpublish && (
            <DropdownMenuItem onClick={() => handleBulkAction(onBulkUnpublish)}>
              <EyeOff className="mr-2 h-4 w-4" />
              Batal Publikasi
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Hapus ({selectedIds.length})
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus {selectedIds.length} {entityName}?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Semua {entityName} yang dipilih akan dihapus secara permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessing}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isProcessing ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface BulkSelectCheckboxProps {
  id: string;
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function BulkSelectCheckbox({ id, selectedIds, onToggle }: BulkSelectCheckboxProps) {
  return (
    <Checkbox
      checked={selectedIds.includes(id)}
      onCheckedChange={() => onToggle(id)}
      onClick={(e) => e.stopPropagation()}
    />
  );
}
