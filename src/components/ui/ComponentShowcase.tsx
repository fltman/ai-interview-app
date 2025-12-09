import React, { useState } from 'react';
import { Settings, Mic, Download } from 'lucide-react';
import {
  Button,
  Input,
  Textarea,
  Select,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Modal,
  ModalBody,
  ModalFooter,
  useToast,
  AudioVisualizer,
  PulseIndicator,
  ProgressBar,
  StepIndicator,
  CircularProgress,
  Skeleton,
  SkeletonCard,
  SkeletonList,
  SkeletonForm,
} from './index';

/**
 * ComponentShowcase - Demo page showing all UI components
 * This is for development/testing purposes only
 */
export const ComponentShowcase: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [selectValue, setSelectValue] = useState('');
  const toast = useToast();

  return (
    <div className="min-h-screen bg-gray-50 p-4 pb-safe">
      <div className="max-w-4xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">UI Components Showcase</h1>

        {/* Buttons */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Buttons</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <Button variant="primary">Primary Button</Button>
                <Button variant="secondary">Secondary Button</Button>
                <Button variant="outline">Outline Button</Button>
                <Button variant="ghost">Ghost Button</Button>
                <Button variant="danger">Danger Button</Button>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" size="sm">
                  Small
                </Button>
                <Button variant="primary" size="md">
                  Medium
                </Button>
                <Button variant="primary" size="lg">
                  Large
                </Button>
              </div>
              <div className="flex flex-wrap gap-4">
                <Button variant="primary" loading>
                  Loading
                </Button>
                <Button variant="primary" icon={<Mic size={20} />}>
                  With Icon
                </Button>
                <Button variant="primary" icon={<Settings size={20} />} iconPosition="right">
                  Icon Right
                </Button>
              </div>
              <Button variant="primary" fullWidth>
                Full Width Button
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Inputs */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Input Fields</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-4">
              <Input
                label="Email"
                type="email"
                placeholder="Enter your email"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                helperText="We'll never share your email"
              />
              <Input label="Password" type="password" placeholder="Enter password" />
              <Input label="Error Example" error="This field is required" />
              <Textarea
                label="Description"
                placeholder="Enter a description"
                rows={4}
                helperText="Maximum 500 characters"
              />
              <Select
                label="Select an option"
                value={selectValue}
                onChange={(e) => setSelectValue(e.target.value)}
                placeholder="Choose one..."
                options={[
                  { value: 'option1', label: 'Option 1' },
                  { value: 'option2', label: 'Option 2' },
                  { value: 'option3', label: 'Option 3' },
                ]}
              />
            </div>
          </CardBody>
        </Card>

        {/* Cards */}
        <Card hover>
          <CardHeader>
            <h2 className="text-xl font-semibold">Card Component</h2>
          </CardHeader>
          <CardBody>
            <p className="text-gray-600">This is a card with header, body, and footer.</p>
          </CardBody>
          <CardFooter>
            <div className="flex gap-3">
              <Button variant="secondary">Cancel</Button>
              <Button variant="primary">Save</Button>
            </div>
          </CardFooter>
        </Card>

        {/* Modal */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Modal</h2>
          </CardHeader>
          <CardBody>
            <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
          </CardBody>
        </Card>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Example Modal"
          size="md"
        >
          <ModalBody>
            <p className="text-gray-600">
              This is a modal dialog. On mobile, it appears as a bottom sheet. On desktop, it's
              centered.
            </p>
            <Input label="Name" placeholder="Enter your name" className="mt-4" />
          </ModalBody>
          <ModalFooter>
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={() => setIsModalOpen(false)}>
              Confirm
            </Button>
          </ModalFooter>
        </Modal>

        {/* Toast */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Toast Notifications</h2>
          </CardHeader>
          <CardBody>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary" onClick={() => toast.success('Success message!')}>
                Success Toast
              </Button>
              <Button variant="danger" onClick={() => toast.error('Error message!')}>
                Error Toast
              </Button>
              <Button variant="secondary" onClick={() => toast.warning('Warning message!')}>
                Warning Toast
              </Button>
              <Button variant="outline" onClick={() => toast.info('Info message!')}>
                Info Toast
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Audio Visualization */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Audio Visualization</h2>
          </CardHeader>
          <CardBody>
            <div className="flex flex-col items-center gap-6">
              <AudioVisualizer isRecording={isRecording} size="lg" />
              <div className="flex gap-4 items-center">
                <PulseIndicator isActive={isRecording} size="lg" color="danger" />
                <Button
                  variant={isRecording ? 'danger' : 'primary'}
                  onClick={() => setIsRecording(!isRecording)}
                  icon={<Mic size={20} />}
                >
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </Button>
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Progress Indicators */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Progress Indicators</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              <ProgressBar value={65} showLabel label="Upload Progress" />
              <ProgressBar value={100} color="success" showLabel label="Completed" />
              <ProgressBar value={25} color="warning" showLabel label="In Progress" />

              <div className="flex justify-center">
                <CircularProgress value={75} label="Complete" />
              </div>

              <StepIndicator
                steps={['Settings', 'Interview', 'Review', 'Export']}
                currentStep={2}
              />
            </div>
          </CardBody>
        </Card>

        {/* Skeleton Loaders */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Skeleton Loaders</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Basic Skeleton</h3>
                <div className="space-y-2">
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="text" width="80%" />
                  <Skeleton variant="text" width="60%" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Skeleton Card</h3>
                <SkeletonCard />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Skeleton List</h3>
                <SkeletonList items={3} />
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Skeleton Form</h3>
                <SkeletonForm fields={3} />
              </div>
            </div>
          </CardBody>
        </Card>

        {/* Interactive Card */}
        <Card interactive hover onClick={() => toast.info('Card clicked!')}>
          <CardBody>
            <div className="flex items-center gap-4">
              <Download size={24} className="text-primary-500" />
              <div>
                <h3 className="font-semibold">Interactive Card</h3>
                <p className="text-sm text-gray-600">Click me to trigger a toast!</p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
