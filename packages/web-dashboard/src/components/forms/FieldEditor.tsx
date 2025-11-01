'use client';

import React from 'react';
import { PreChatFormField, FormFieldType } from '@chatdesk/shared';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus, GripVertical } from 'lucide-react';

interface FieldEditorProps {
  field: PreChatFormField;
  onUpdate: (field: PreChatFormField) => void;
  onDelete: () => void;
  dragHandleProps?: any;
}

export function FieldEditor({ field, onUpdate, onDelete, dragHandleProps }: FieldEditorProps) {
  const updateField = (updates: Partial<PreChatFormField>) => {
    onUpdate({ ...field, ...updates });
  };

  const addOption = () => {
    const options = field.options || [];
    updateField({ options: [...options, `Option ${options.length + 1}`] });
  };

  const updateOption = (index: number, value: string) => {
    const options = [...(field.options || [])];
    options[index] = value;
    updateField({ options });
  };

  const removeOption = (index: number) => {
    const options = [...(field.options || [])];
    options.splice(index, 1);
    updateField({ options });
  };

  return (
    <div className="border rounded-lg p-4 bg-white space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div {...dragHandleProps} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-5 w-5 text-gray-400" />
          </div>
          <h4 className="font-medium">Field Settings</h4>
        </div>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Field Type */}
        <div>
          <Label htmlFor={`type-${field.id}`}>Field Type</Label>
          <Select
            value={field.type}
            onValueChange={(value) => updateField({ type: value as FormFieldType })}
          >
            <SelectTrigger id={`type-${field.id}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="phone">Phone</SelectItem>
              <SelectItem value="textarea">Textarea</SelectItem>
              <SelectItem value="select">Select</SelectItem>
              <SelectItem value="checkbox">Checkbox</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Required Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor={`required-${field.id}`}>Required</Label>
          <Switch
            id={`required-${field.id}`}
            checked={field.required}
            onCheckedChange={(checked) => updateField({ required: checked })}
          />
        </div>
      </div>

      {/* Label */}
      <div>
        <Label htmlFor={`label-${field.id}`}>Label</Label>
        <Input
          id={`label-${field.id}`}
          value={field.label}
          onChange={(e) => updateField({ label: e.target.value })}
          placeholder="Enter field label"
        />
      </div>

      {/* Placeholder (not for checkbox) */}
      {field.type !== 'checkbox' && (
        <div>
          <Label htmlFor={`placeholder-${field.id}`}>Placeholder</Label>
          <Input
            id={`placeholder-${field.id}`}
            value={field.placeholder || ''}
            onChange={(e) => updateField({ placeholder: e.target.value })}
            placeholder="Enter placeholder text"
          />
        </div>
      )}

      {/* Help Text */}
      <div>
        <Label htmlFor={`help-${field.id}`}>Help Text (Optional)</Label>
        <Input
          id={`help-${field.id}`}
          value={field.helpText || ''}
          onChange={(e) => updateField({ helpText: e.target.value })}
          placeholder="Additional help text"
        />
      </div>

      {/* Options (for select type) */}
      {field.type === 'select' && (
        <div>
          <Label>Options</Label>
          <div className="space-y-2 mt-2">
            {(field.options || []).map((option, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option}
                  onChange={(e) => updateOption(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => removeOption(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addOption} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>
        </div>
      )}

      {/* Validation Rules */}
      {(field.type === 'text' || field.type === 'textarea') && (
        <div className="border-t pt-4 space-y-3">
          <h5 className="font-medium text-sm">Validation Rules</h5>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor={`minLength-${field.id}`}>Min Length</Label>
              <Input
                id={`minLength-${field.id}`}
                type="number"
                value={field.validation?.minLength || ''}
                onChange={(e) =>
                  updateField({
                    validation: {
                      ...field.validation,
                      minLength: e.target.value ? parseInt(e.target.value) : undefined,
                    },
                  })
                }
                placeholder="Min"
              />
            </div>
            <div>
              <Label htmlFor={`maxLength-${field.id}`}>Max Length</Label>
              <Input
                id={`maxLength-${field.id}`}
                type="number"
                value={field.validation?.maxLength || ''}
                onChange={(e) =>
                  updateField({
                    validation: {
                      ...field.validation,
                      maxLength: e.target.value ? parseInt(e.target.value) : undefined,
                    },
                  })
                }
                placeholder="Max"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

