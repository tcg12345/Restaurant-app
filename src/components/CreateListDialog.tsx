import { useState } from 'react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Plus, X } from 'lucide-react';

interface CreateListDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateList: (name: string, description?: string) => Promise<any>;
  onListCreated?: (list: any) => void;
}

export function CreateListDialog({ isOpen, onClose, onCreateList, onListCreated }: CreateListDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      const createdList = await onCreateList(name.trim(), description.trim() || undefined);
      setName('');
      setDescription('');
      onClose();
      if (onListCreated && createdList) {
        onListCreated(createdList);
      }
    } catch (error) {
      console.error('Error creating list:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DrawerContent className="max-h-[90vh] px-0">
        {/* Handle bar */}
        <div className="w-full flex justify-center pt-4 pb-2">
          <div className="w-12 h-1.5 bg-muted rounded-full" />
        </div>
        
        {/* Header */}
        <DrawerHeader className="px-6 pb-4">
          <div className="flex items-center justify-between">
            <DrawerTitle className="text-xl font-semibold flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Plus className="w-4 h-4 text-primary" />
              </div>
              Create New List
            </DrawerTitle>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-muted/50 hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Organize your favorite restaurants into custom collections
          </p>
        </DrawerHeader>
        
        {/* Content */}
        <div className="px-6 pb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="list-name" className="text-sm font-medium">
                List Name *
              </Label>
              <Input
                id="list-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Date Night Spots, Michelin Stars, etc."
                required
                maxLength={100}
                className="h-12 text-base bg-muted/30 border-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:bg-background"
                autoFocus
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Choose a descriptive name for your list</span>
                <span>{name.length}/100</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <Label htmlFor="list-description" className="text-sm font-medium">
                Description (Optional)
              </Label>
              <Textarea
                id="list-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this list..."
                maxLength={500}
                rows={3}
                className="text-base bg-muted/30 border-0 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-0 focus-visible:bg-background resize-none"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Add context about what restaurants belong in this list</span>
                <span>{description.length}/500</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleClose}
                className="flex-1 h-12 text-base"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={!name.trim() || isSubmitting}
                className="flex-1 h-12 text-base bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Creating...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Create List
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
}