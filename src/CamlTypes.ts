// FieldRef and Value

export interface ListPropertyNode {
    nodeType: 'ListProperty';
    AutoHyperLink: boolean;
    AutoHyperLinkNoEncoding: boolean;
    AutoNewLine: boolean;
    Default: string;
    ExpandXML: boolean;
    HTMLEncode: boolean;
    Select: string;
    StripWS: boolean;
    URLEncode: boolean;
    URLEncodeAsURL: boolean;
}

export interface ProjectPropertyNode {
    nodeType: 'ProjectProperty';
    AutoHyperLink: boolean;
    AutoHyperLinkNoEncoding: boolean;
    AutoNewLine: boolean;
    Default: string;
    ExpandXML: boolean;
    HTMLEncode: boolean;
    Select: string;
    StripWS: boolean;
    URLEncode: boolean;
    URLEncodeAsURL: boolean;
}

export interface YearNode {
    nodeType: 'Year';
}

export interface MonthNode {
    nodeType: 'Month';
}

export interface WeekNode {
    nodeType: 'Week';
}

export interface NowNode {
    nodeType: 'Now';
}

export interface TodayNode {
    nodeType: 'Today';
    OffsetDays: number;
}

export interface UserIDNode {
    nodeType: 'UserID';
}

export interface ValueNode {
    nodeType: 'Value';
    Type: string;
    IncludeTimeValue?: boolean;
    children?: Array<
        ListPropertyNode | ProjectPropertyNode | YearNode | MonthNode | WeekNode | Node | TodayNode | UserIDNode
    >;
    value: string;
}

export interface ValuesNode {
    nodeType: 'Values';
    children: Array<ValueNode>;
}

export interface FieldRefNode {
    nodeType: 'FieldRef';
    Alias?: string;
    Ascending?: boolean;
    CreateURL?: string;
    DisplayName?: string;
    Explicit?: boolean;
    Format?: string;
    ID?: string;
    Key?: string;
    List?: string;
    LookupId?: boolean;
    Name: string;
    RefType?: string;
    ShowField?: string;
    TextOnly?: boolean;
    Type?: string;
}

// Comparison Nodes
export interface BeginsWithNode {
    nodeType: 'BeginsWith';
    left: FieldRefNode | ValueNode;
    right: FieldRefNode | ValueNode;
}

export interface ContainsNode {
    nodeType: 'Contains';
    left: FieldRefNode | ValueNode;
    right: FieldRefNode | ValueNode;
}

export interface DateRangesOverlapNode {
    nodeType: 'DateRangesOverlap';
    start: FieldRefNode;
    end: FieldRefNode;
    recurrence: FieldRefNode;
    value: ValueNode;
}

export interface EqNode {
    nodeType: 'Eq';
    left: FieldRefNode | ValueNode;
    right: FieldRefNode | ValueNode;
}

export interface GeqNode {
    nodeType: 'Geq';
    left: FieldRefNode | ValueNode;
    right: FieldRefNode | ValueNode;
}

export interface GtNode {
    nodeType: 'Gt';
    left: FieldRefNode | ValueNode;
    right: FieldRefNode | ValueNode;
}

export interface InNode {
    nodeType: 'In';
    field: FieldRefNode;
    values: ValuesNode;
}

export interface IncludesNode {
    nodeType: 'Includes';
    field: FieldRefNode;
    value: ValueNode;
}

export interface IsNotNullNode {
    nodeType: 'IsNotNull';
    value: FieldRefNode | ValueNode;
}

export interface IsNullNode {
    nodeType: 'IsNull';
    value: FieldRefNode | ValueNode;
}

export interface LeqNode {
    nodeType: 'Leq';
    left: FieldRefNode | ValueNode;
    right: FieldRefNode | ValueNode;
}

export interface LtNode {
    nodeType: 'Lt';
    left: FieldRefNode | ValueNode;
    right: FieldRefNode | ValueNode;
}

export interface MembershipNode {
    nodeType: 'Membership';
    Type: 'SPWeb.AllUsers' | 'SPGroup' | 'SPWeb.Groups' | 'CurrentUserGroups' | 'SPWeb.Users';
    field: FieldRefNode;
}

export interface NeqNode {
    nodeType: 'Neq';
    left: FieldRefNode | ValueNode;
    right: FieldRefNode | ValueNode;
}

export interface NotIncludesNode {
    nodeType: 'NotIncludes';
    field: FieldRefNode;
    value: ValueNode;
}

export type ComparisonNode =
    | BeginsWithNode
    | ContainsNode
    | DateRangesOverlapNode
    | EqNode
    | GeqNode
    | GtNode
    | InNode
    | IncludesNode
    | IsNotNullNode
    | IsNullNode
    | LeqNode
    | LtNode
    | MembershipNode
    | NeqNode
    | NotIncludesNode;

// Logic Nodes
export interface AndNode {
    nodeType: 'And';
    left: ComparisonNode | LogicNode;
    right: ComparisonNode | LogicNode;
}

export interface OrNode {
    nodeType: 'Or';
    left: ComparisonNode | LogicNode;
    right: ComparisonNode | LogicNode;
}

export type LogicNode = AndNode | OrNode;

export interface WhereNode {
    nodeType: 'Where';
    body: ComparisonNode | LogicNode;
}

export interface GroupByNode {
    nodeType: 'GroupBy';
    Collapse: boolean;
    children: FieldRefNode;
}

export interface OrderByNode {
    nodeType: 'OrderBy';
    Override: boolean;
    UseIndexForOrderBy: boolean;
}

export interface QueryNode {
    nodeType: 'Query';
    where?: WhereNode;
    groupBy?: GroupByNode;
    orderBy?: OrderByNode;
}

export interface FilterNode {
    nodeType: 'Filter';
    Name: string;
    Value: string;
}

export interface MethodNode {
    nodeType: 'Method';
    Name: string;
    filters: FilterNode[];
}

export interface ViewFieldsNode {
    nodeType: 'ViewFields';
    fieldRefs: FieldRefNode[];
}

export interface ViewNode {
    nodeType: 'View';
    query?: QueryNode;
    method?: MethodNode;
    viewFields?: ViewFieldsNode;
}
