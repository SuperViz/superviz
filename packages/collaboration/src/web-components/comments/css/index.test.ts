import { annotationItemStyle } from './annotation-item.style';
import { annotationPinStyles } from './annotation-pin.style';
import { annotationResolvedStyle } from './annotation-resolved.style';
import { commentInputStyle } from './comment-input.style';
import { commentItemStyle } from './comment-item.style';
import { contentStyle } from './content.style';
import { poweredByStyle } from './powered-by.style';
import { topbarStyle } from './topbar.style';

import * as cssStyles from '.';

describe('css', () => {
  test('should be export CommentsContent', () => {
    expect(cssStyles.contentStyle).toBeDefined();
    expect(cssStyles.contentStyle).toBe(contentStyle);
    expect(cssStyles.poweredByStyle).toBeDefined();
    expect(cssStyles.poweredByStyle).toBe(poweredByStyle);
  });

  test('should be export CommentsCommentItem', () => {
    expect(cssStyles.commentItemStyle).toBeDefined();
    expect(cssStyles.commentItemStyle).toBe(commentItemStyle);
  });

  test('should be export CommentsCommentInput', () => {
    expect(cssStyles.commentInputStyle).toBeDefined();
    expect(cssStyles.commentInputStyle).toBe(commentInputStyle);
  });

  test('should be export CommentsAnnotationPin', () => {
    expect(cssStyles.annotationItemStyle).toBeDefined();
    expect(cssStyles.annotationItemStyle).toBe(annotationItemStyle);
  });

  test('should be export CommentsAnnotationItem', () => {
    expect(cssStyles.topbarStyle).toBeDefined();
    expect(cssStyles.topbarStyle).toBe(topbarStyle);
  });

  test('should be export CommentsAnnotationResolved', () => {
    expect(cssStyles.annotationResolvedStyle).toBeDefined();
    expect(cssStyles.annotationResolvedStyle).toBe(annotationResolvedStyle);
  });

  test('should be export AnnotationPinStyle', () => {
    expect(cssStyles.annotationPinStyles).toBeDefined();
    expect(cssStyles.annotationPinStyles).toBe(annotationPinStyles);
  });
});
