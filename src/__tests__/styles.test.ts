import '../index.less';

describe('swipe action styles', () => {
  afterEach(() => {
    document.body.innerHTML = '';
  });

  it('applies a 16px border radius to the swipe action container', () => {
    document.body.innerHTML = '<div class="expense-swipe-action adm-swipe-action"></div>';

    const swipeAction = document.querySelector('.expense-swipe-action') as HTMLElement | null;

    expect(swipeAction).not.toBeNull();
    expect(getComputedStyle(swipeAction!).borderRadius).toBe('16px');
  });
});
