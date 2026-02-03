import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RestaurantForm } from "@/components/RestaurantForm";
import { Restaurant, RestaurantFormData } from "@/types/restaurant";
import { useIsMobile } from "@/hooks/useIsMobile";
import { X, Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
interface RestaurantDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  restaurant?: Restaurant;
  onSave: (data: RestaurantFormData) => void;
  dialogType: "add" | "edit";
  defaultWishlist?: boolean;
  hideSearch?: boolean;
  defaultSelectedListId?: string; // Default list to select
}

export function RestaurantDialog({
  isOpen,
  onOpenChange,
  restaurant,
  onSave,
  dialogType,
  defaultWishlist = false,
  hideSearch = false,
  defaultSelectedListId,
}: RestaurantDialogProps) {
  const isMobile = useIsMobile();
  
  const handleSave = (data: RestaurantFormData) => {
    onSave(data);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (isMobile) {
    return (
      <Drawer open={isOpen} onOpenChange={onOpenChange}>
        <DrawerContent className="bg-background border-0 shadow-2xl">
          <div className="w-full">
            {/* Modern Header with Better Visual Hierarchy */}
            <div className="bg-card border-b border-border/50 px-6 pt-6 pb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {dialogType === "add" ? (
                      <Plus className="h-5 w-5 text-primary" />
                    ) : (
                      <Sparkles className="h-5 w-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <DialogTitle className="text-xl font-semibold">
                      {dialogType === "add" ? "Add Restaurant" : "Edit Restaurant"}
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground mt-0.5">
                      {dialogType === "add"
                        ? "Add a new restaurant to your collection"
                        : "Update restaurant details"}
                    </DialogDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCancel}
                  className="h-9 w-9 rounded-full hover:bg-muted/50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Content Area with Better Spacing */}
            <div className="max-h-[75vh] overflow-y-auto">
              <div className="px-6 py-6 w-full overflow-x-hidden">
                <RestaurantForm
                  initialData={restaurant}
                  onSubmit={handleSave}
                  onCancel={handleCancel}
                  defaultWishlist={defaultWishlist}
                  hideSearch={hideSearch}
                  defaultSelectedListId={defaultSelectedListId}
                />
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    );
  }
  // Desktop version - modern and clean
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden shadow-2xl">
        <DialogHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              {dialogType === "add" ? (
                <Plus className="h-5 w-5 text-primary" />
              ) : (
                <Sparkles className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <DialogTitle className="text-2xl font-semibold">
                {dialogType === "add" ? "Add Restaurant" : "Edit Restaurant"}
              </DialogTitle>
              <DialogDescription className="text-base mt-1">
                {dialogType === "add"
                  ? "Add a new restaurant to your collection"
                  : "Update restaurant details and ratings"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="max-h-[70vh] overflow-y-auto overflow-x-hidden">
          <RestaurantForm
            initialData={restaurant}
            onSubmit={handleSave}
            onCancel={handleCancel}
            defaultWishlist={defaultWishlist}
            hideSearch={hideSearch}
            defaultSelectedListId={defaultSelectedListId}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}