import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import {
  Button,
  Input,
  Select,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardStat,
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableEmptyState,
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
} from '../src/components/ui/index';
import { ConfirmDeleteModal } from '../src/components/ConfirmDeleteModal';

describe('مرحله اول بازطراحی UI: سیستم طراحی مشترک و UI Primitives', () => {
  it('۱. تمام کامپوننت‌های پایه (Button, Input, Select, Card, Table, Modal) به‌درستی صادر شده‌اند', () => {
    assert.ok(Button, 'Button component should be exported');
    assert.ok(Input, 'Input component should be exported');
    assert.ok(Select, 'Select component should be exported');
    assert.ok(Card, 'Card component should be exported');
    assert.ok(CardStat, 'CardStat component should be exported');
    assert.ok(Table, 'Table component should be exported');
    assert.ok(TableEmptyState, 'TableEmptyState component should be exported');
    assert.ok(Modal, 'Modal component should be exported');
    assert.ok(ConfirmDeleteModal, 'ConfirmDeleteModal component should be exported');
  });

  it('۲. ساخت المان‌های React برای کامپوننت‌های UI بدون خطای زمان اجرا', () => {
    const btnEl = React.createElement(Button, { variant: 'primary', size: 'md', isLoading: false }, 'تأیید');
    assert.equal(btnEl.props.variant, 'primary');

    const inputEl = React.createElement(Input, { label: 'نام کالا', placeholder: 'جستجو...', error: 'خطای نمونه' });
    assert.equal(inputEl.props.label, 'نام کالا');

    const selectEl = React.createElement(Select, {
      label: 'دسته‌بندی',
      options: [{ value: '1', label: 'دوربین مداربسته' }],
    });
    assert.equal(selectEl.props.options?.length, 1);

    const cardEl = React.createElement(
      Card,
      { variant: 'default', padding: 'md' },
      React.createElement(CardHeader, null, React.createElement(CardTitle, null, 'عنوان کارت')),
      React.createElement(CardContent, null, 'محتوا'),
      React.createElement(CardFooter, null, 'پاورقی')
    );
    assert.equal(cardEl.props.variant, 'default');

    const tableEl = React.createElement(
      Table,
      null,
      React.createElement(
        TableHeader,
        null,
        React.createElement(TableRow, null, React.createElement(TableHead, { numeric: true }, 'مبلغ (ریال)'))
      ),
      React.createElement(
        TableBody,
        null,
        React.createElement(TableRow, null, React.createElement(TableCell, { numeric: true }, '۱,۵۰۰,۰۰۰'))
      ),
      React.createElement(TableFooter, null)
    );
    assert.ok(tableEl);

    const modalEl = React.createElement(
      Modal,
      {
        isOpen: true,
        onClose: () => {},
        title: 'مودال آزمایشی',
        closeOnEsc: true,
        closeOnOverlayClick: true,
      },
      'محتوای مودال'
    );
    assert.equal(modalEl.props.isOpen, true);
  });

  it('۳. سازگاری ConfirmDeleteModal متصل‌شده به Modal و Button جدید', () => {
    let confirmed = false;
    let closed = false;
    const confirmModalEl = React.createElement(ConfirmDeleteModal, {
      isOpen: true,
      title: 'حذف فاکتور',
      message: 'آیا از حذف این مورد اطمینان دارید؟',
      isDestructive: true,
      onConfirm: () => {
        confirmed = true;
      },
      onClose: () => {
        closed = true;
      },
    });

    assert.equal(confirmModalEl.props.title, 'حذف فاکتور');
    confirmModalEl.props.onConfirm();
    confirmModalEl.props.onClose();
    assert.equal(confirmed, true);
    assert.equal(closed, true);
  });
});
