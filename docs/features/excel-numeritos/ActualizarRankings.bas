Attribute VB_Name = "ActualizarRankings"
' ============================================================================
' Numeritos de Beisbol - macro de orden automatico (variante .xlsm)
' Referencia. Requiere el libro .xlsm con la misma maqueta que el .xlsx:
'   - hoja "posiciones" con tabla cruda en A3:K22 (Equipo..Average) y
'     salida ordenada a partir de la fila 26.
'   - hoja "total general" con el consolidado ofensivo en filas 8..507
'     (NOMBRE A, HR I, CI J, H F, AV U, SLG V) y lanzadores 511..1010
'     (NOMBRE A, JJ C, JG D, INN F, K H, H I, PCL/ERA J).
' ============================================================================
Option Explicit

Sub ActualizarRankings()
    Application.ScreenUpdating = False
    Application.Calculation = xlCalculationManual
    On Error GoTo Final

    ' 1) Ordenar la tabla de posiciones: Average (K) desc, luego DIF (H) desc.
    OrdenarPosiciones

    ' 2) Regenerar lideres ofensivos y de lanzadores.
    EscribirLideres

Final:
    Application.Calculation = xlCalculationAutomatic
    Application.ScreenUpdating = True
End Sub

Private Sub OrdenarPosiciones()
    Dim ws As Worksheet
    Set ws = ThisWorkbook.Worksheets("posiciones")
    With ws.Sort
        .SortFields.Clear
        .SortFields.Add Key:=ws.Range("K3:K22"), SortOn:=xlSortOnValues, Order:=xlDescending
        .SortFields.Add Key:=ws.Range("H3:H22"), SortOn:=xlSortOnValues, Order:=xlDescending
        .SetRange ws.Range("A3:K22")
        .Header = xlNo
        .Apply
    End With
End Sub

' Escribe en "lideres" el top 10 (con empates) de una categoria.
'   srcRange : rango de NOMBRES (1 columna, ej. total general!A8:A507)
'   valRange : rango de VALORES a ordenar
'   destTop  : celda superior izquierda donde escribir NOMBRE / EQUIPO / VALOR
'   asc      : True si "menor es mejor" (PCL/ERA, H permitidos)
Private Sub Top10(srcRange As Range, orgRange As Range, valRange As Range, destTop As Range, asc As Boolean)
    Dim vals As Variant, n As Long, i As Long
    n = valRange.Rows.Count
    ' copiar valores a arrays
    Dim names() As Variant, orgs() As Variant, nums() As Double
    ReDim names(1 To n, 1 To 1), orgs(1 To n, 1 To 1), nums(1 To n)
    vals = valRange.Value
    For i = 1 To n
        names(i, 1) = srcRange.Cells(i, 1).Value
        orgs(i, 1) = orgRange.Cells(i, 1).Value
        If IsNumeric(vals(i, 1)) Then nums(i) = vals(i, 1) Else nums(i) = 0
    Next i

    ' corte: valor del decimo puesto (o SMALL para "menor es mejor")
    Dim cutoff As Double
    Dim tmp As New Collection
    For i = 1 To n
        If nums(i) <> 0 Then tmp.Add nums(i)
    Next i
    If tmp.Count = 0 Then Exit Sub
    Dim arr() As Double
    ReDim arr(1 To tmp.Count)
    For i = 1 To tmp.Count: arr(i) = tmp(i): Next i
    ' bubble sort por simplicidad (n <= 500)
    Dim a As Long, b As Long, t As Double
    For a = 1 To tmp.Count - 1
        For b = a + 1 To tmp.Count
            If (asc And arr(a) > arr(b)) Or (Not asc And arr(a) < arr(b)) Then
                t = arr(a): arr(a) = arr(b): arr(b) = t
            End If
        Next b
    Next a
    If tmp.Count >= 10 Then cutoff = arr(10) Else cutoff = arr(tmp.Count)

    ' escribir filas ordenadas que cumplan el corte (con empates)
    Dim outR As Long
    outR = destTop.Row
    destTop.Offset(0, 0).Resize(50, 3).ClearContents
    For a = 1 To tmp.Count
        ' buscar cada elemento en orden; escribirlo si cumple corte
    Next a
    ' (implementacion simplificada: escribir top-10 estrictos + empatados)
    Dim written As Long
    written = 0
    Dim k As Long
    For k = 1 To tmp.Count
        If written >= 15 Then Exit For
        For i = 1 To n
            If nums(i) = arr(k) Then
                If (asc And arr(k) <= cutoff) Or (Not asc And arr(k) >= cutoff) Then
                    destTop.Offset(written, 0).Value = names(i, 1)
                    destTop.Offset(written, 1).Value = orgs(i, 1)
                    destTop.Offset(written, 2).Value = arr(k)
                    written = written + 1
                End If
            End If
        Next i
    Next k
End Sub

Private Sub EscribirLideres()
    Dim tg As Worksheet, ld As Worksheet
    Set tg = ThisWorkbook.Worksheets("total general")
    Set ld = ThisWorkbook.Worksheets("lideres")

    ' Ofensivos
    Top10 tg.Range("A8:A507"), tg.Range("B8:B507"), tg.Range("U8:U507"), ld.Range("A3"), False   ' AV
    Top10 tg.Range("A8:A507"), tg.Range("B8:B507"), tg.Range("V8:V507"), ld.Range("A8"), False   ' SLG
    Top10 tg.Range("A8:A507"), tg.Range("B8:B507"), tg.Range("I8:I507"), ld.Range("A13"), False  ' HR
    Top10 tg.Range("A8:A507"), tg.Range("B8:B507"), tg.Range("J8:J507"), ld.Range("A18"), False  ' CI
    Top10 tg.Range("A8:A507"), tg.Range("B8:B507"), tg.Range("F8:F507"), ld.Range("A23"), False  ' H

    ' Lanzadores (filtro JJ>0 lo aproxima valRange; se asume columna C = JJ)
    Top10 tg.Range("A511:A1010"), tg.Range("B511:B1010"), tg.Range("J511:J1010"), ld.Range("A28"), True  ' PCL/ERA (menor)
    Top10 tg.Range("A511:A1010"), tg.Range("B511:B1010"), tg.Range("D511:D1010"), ld.Range("A33"), False ' JG
    Top10 tg.Range("A511:A1010"), tg.Range("B511:B1010"), tg.Range("H511:H1010"), ld.Range("A38"), False ' K
    Top10 tg.Range("A511:A1010"), tg.Range("B511:B1010"), tg.Range("F511:F1010"), ld.Range("A43"), False ' INN
    Top10 tg.Range("A511:A1010"), tg.Range("B511:B1010"), tg.Range("I511:I1010"), ld.Range("A48"), True  ' H permitidos (menor)
End Sub
