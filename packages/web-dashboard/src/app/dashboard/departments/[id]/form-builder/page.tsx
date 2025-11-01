'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { PreChatFormField, FormFieldType } from '@chatdesk/shared';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FieldEditor } from '@/components/forms/FieldEditor';
import { FieldPreview } from '@/components/forms/FieldPreview';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { createBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, Plus, Save, Eye, Settings, ArrowLeft } from 'lucide-react';

interface SortableFieldProps {
  field: PreChatFormField;
  onUpdate: (field: PreChatFormField) => void;
  onDelete: () => void;
}

function SortableField({ field, onUpdate, onDelete }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: field.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <FieldEditor
        field={field}
        onUpdate={onUpdate}
        onDelete={onDelete}
        dragHandleProps={listeners}
      />
    </div>
  );
}

export default function FormBuilderPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const supabase = createBrowserClient();
  
  const departmentId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [department, setDepartment] = useState<any>(null);
  const [fields, setFields] = useState<PreChatFormField[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (user && departmentId) {
      fetchDepartment();
    }
  }, [user, departmentId]);

  const getAccessToken = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  };

  const fetchDepartment = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getAccessToken();
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`/api/department/${departmentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch department');
      }

      const data = await response.json();
      setDepartment(data.department);
      setFields(data.department.pre_chat_form || []);
    } catch (err: any) {
      console.error('Error fetching department:', err);
      setError(err.message || 'Failed to load department');
    } finally {
      setLoading(false);
    }
  };

  const addField = (type: FormFieldType) => {
    const newField: PreChatFormField = {
      id: `field_${Date.now()}`,
      type,
      label: `New ${type} field`,
      placeholder: '',
      required: false,
      order: fields.length,
      options: type === 'select' ? ['Option 1', 'Option 2'] : undefined,
    };
    setFields([...fields, newField]);
  };

  const updateField = (index: number, updatedField: PreChatFormField) => {
    const newFields = [...fields];
    newFields[index] = updatedField;
    setFields(newFields);
  };

  const deleteField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    // Update order
    newFields.forEach((field, i) => {
      field.order = i;
    });
    setFields(newFields);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setFields((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        // Update order
        newItems.forEach((field, i) => {
          field.order = i;
        });
        return newItems;
      });
    }
  };

  const saveForm = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const token = await getAccessToken();
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await fetch(`/api/department/${departmentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pre_chat_form: fields,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save form');
      }

      setSuccess('Form saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error('Error saving form:', err);
      setError(err.message || 'Failed to save form');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  if (!department) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <p className="text-gray-500">Department not found</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/departments')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Pre-chat Form Builder</h1>
              <p className="text-gray-500 mt-1">
                {department.name} - Customize the form customers fill before starting a chat
              </p>
            </div>
          </div>
          <Button onClick={saveForm} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Form
              </>
            )}
          </Button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="builder" className="w-full">
          <TabsList>
            <TabsTrigger value="builder">
              <Settings className="h-4 w-4 mr-2" />
              Builder
            </TabsTrigger>
            <TabsTrigger value="preview">
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="builder" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Form Fields</h2>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => addField('text')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Text
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addField('email')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addField('phone')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Phone
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addField('textarea')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Textarea
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addField('select')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Select
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => addField('checkbox')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Checkbox
                  </Button>
                </div>
              </div>

              {fields.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <p className="text-gray-500 mb-4">No fields added yet</p>
                  <p className="text-sm text-gray-400">Click the buttons above to add form fields</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={fields.map(f => f.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <SortableField
                          key={field.id}
                          field={field}
                          onUpdate={(updatedField) => updateField(index, updatedField)}
                          onDelete={() => deleteField(index)}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="preview">
            <Card className="p-6 max-w-2xl mx-auto">
              <h2 className="text-lg font-semibold mb-4">Form Preview</h2>
              <p className="text-sm text-gray-500 mb-6">
                This is how the form will appear to customers
              </p>
              {fields.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-lg">
                  <p className="text-gray-500">No fields to preview</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fields.map((field) => (
                    <FieldPreview key={field.id} field={field} />
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

